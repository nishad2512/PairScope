import { Channel, ConsumeMessage } from "amqplib";
import { EmailService } from "../services/email.service";
import { emailEventSchema } from "../validator/email.validator";
import { ConfirmedPublisher } from "../messaging/publisher";
import { exchanges, retryKey, queues } from "../messaging/topology";
import { canRetry, EmailError, failureCode } from "../utils/email-error";

export class EmailConsumer {
    private readonly running = new Set<Promise<void>>();
    private consumerTag = "";

    constructor(
        private readonly channel: Channel,
        private readonly publisher: ConfirmedPublisher,
        private readonly email: EmailService,
        private readonly retryDelays: number[],
        private readonly onFailure: () => void,
    ) {}

    async start(prefetch: number): Promise<void> {
        await this.channel.prefetch(prefetch);
        const consumer = await this.channel.consume(queues.email, (message) => {
            if (!message) {
                this.onFailure();
                return;
            }
            const job = this.handle(message).catch(() => {
                console.error(JSON.stringify({ action: "email.transfer.failed" }));
                this.onFailure();
            }).finally(() => this.running.delete(job));
            this.running.add(job);
        }, { noAck: false });
        this.consumerTag = consumer.consumerTag;
    }

    private async handle(message: ConsumeMessage): Promise<void> {
        let eventId: string | undefined;
        const attempt: unknown = message.properties.headers?.["x-retry-attempt"] ?? 0;
        try {
            if (!Number.isInteger(attempt) || typeof attempt !== "number" || attempt < 0 || attempt > this.retryDelays.length) {
                throw new EmailError("INVALID_RETRY_ATTEMPT");
            }
            if (message.content.length > 64 * 1024) throw new EmailError("MESSAGE_TOO_LARGE");
            let payload: unknown;
            try {
                payload = JSON.parse(message.content.toString("utf8"));
            } catch {
                throw new EmailError("INVALID_JSON");
            }
            const parsed = emailEventSchema.safeParse(payload);
            if (!parsed.success) throw new EmailError("INVALID_EVENT");
            const event = parsed.data;
            eventId = event.eventId;
            if (message.fields.exchange === exchanges.events && message.fields.routingKey !== event.type) {
                throw new EmailError("EVENT_TYPE_MISMATCH");
            }
            const status = await this.email.deliver(event);
            this.channel.ack(message);
            console.info(JSON.stringify({ action: "email.completed", eventId, status }));
        } catch (error) {
            const retry = canRetry(error) && typeof attempt === "number" && attempt < this.retryDelays.length;
            await this.publisher.publish(
                retry ? exchanges.retry : exchanges.dead,
                retry ? retryKey(attempt as number) : "email",
                message.content,
                {
                    contentType: "application/json",
                    correlationId: eventId,
                    headers: {
                        "x-retry-attempt": retry ? (attempt as number) + 1 : attempt,
                        "x-failure-code": failureCode(error),
                        "x-failed-at": new Date().toISOString(),
                    },
                },
            );
            this.channel.ack(message);
            console.error(JSON.stringify({ action: retry ? "email.retry" : "email.dead", eventId, code: failureCode(error) }));
        }
    }

    async stop(): Promise<void> {
        if (this.consumerTag) await this.channel.cancel(this.consumerTag).catch(() => {});
        await Promise.allSettled(this.running);
    }
}
