import { handleError } from "../utils/error-handler";
import { Channel, ConfirmChannel, ConsumeMessage } from "amqplib";
import { IEmailService } from "../interfaces/email.interface";
import { parseEmailEvent } from "../validator/email.validator";
import { publishEmail } from "../messaging/publisher";
import { exchanges, retryKey, queues } from "../messaging/topology";
import { EmailError } from "../utils/email-error";

export class EmailConsumer {
    private pending: Promise<void> = Promise.resolve();
    private consumerTag = "";

    constructor(
        private readonly channel: Channel,
        private readonly publisher: ConfirmChannel,
        private readonly email: IEmailService,
        private readonly retryDelays: number[],
        private readonly closeConnection: () => void,
    ) {}

    async start(): Promise<void> {
        await this.channel.prefetch(1);
        const consumer = await this.channel.consume(
            queues.email,
            (message) => {
                if (!message) return this.closeConnection();
                this.pending = this.handle(message).catch((error) => {
                    handleError(
                        error,
                        "Email transfer failed; reconnecting before redelivery",
                    );
                    this.closeConnection();
                });
            },
            { noAck: false },
        );
        this.consumerTag = consumer.consumerTag;
    }

    private async handle(message: ConsumeMessage): Promise<void> {
        const header: unknown =
            message.properties.headers?.["x-retry-attempt"] ?? 0;
        const validAttempt =
            typeof header === "number" &&
            Number.isInteger(header) &&
            header >= 0 &&
            header <= this.retryDelays.length;
        const attempt = validAttempt ? header : this.retryDelays.length;

        try {
            if (!validAttempt) throw new EmailError("INVALID_RETRY_ATTEMPT");
            const event = parseEmailEvent(message.content);
            if (
                message.fields.exchange === exchanges.events &&
                message.fields.routingKey !== event.type
            ) {
                throw new EmailError("EVENT_TYPE_MISMATCH");
            }
            const status = await this.email.deliver(event);
            this.channel.ack(message);
            console.info(`Email ${event.eventId}: ${status}`);
        } catch (error) {
            const { code: failure, retryable } = handleError(
                error,
                "Email delivery failed",
            );
            const retry = retryable && attempt < this.retryDelays.length;

            // Confirm the transfer before removing the original message.
            await publishEmail(
                this.publisher,
                retry ? exchanges.retry : exchanges.dead,
                retry ? retryKey(attempt) : "email",
                message.content,
                retry ? attempt + 1 : attempt,
                failure,
            );
            this.channel.ack(message);
            console.error(
                `Email ${retry ? "queued for retry" : "moved to DLQ"}: ${failure}`,
            );
        }
    }

    async stop(): Promise<void> {
        if (this.consumerTag)
            await this.channel.cancel(this.consumerTag).catch(() => {});
        await this.pending;
    }
}
