import { randomUUID } from "node:crypto";
import { ConfirmChannel, Message, Options } from "amqplib";

export class ConfirmedPublisher {
    private readonly pending = new Map<string, { reject: (error: Error) => void; timer: NodeJS.Timeout }>();

    constructor(private readonly channel: ConfirmChannel) {
        channel.on("return", (message: Message) => {
            this.pending.get(message.properties.messageId)?.reject(new Error("UNROUTABLE_MESSAGE"));
        });
        channel.on("close", () => {
            for (const item of this.pending.values()) {
                clearTimeout(item.timer);
                item.reject(new Error("PUBLISH_CHANNEL_CLOSED"));
            }
            this.pending.clear();
        });
    }

    publish(exchange: string, routingKey: string, content: Buffer, properties: Options.Publish = {}): Promise<void> {
        const messageId = randomUUID();
        return new Promise((resolve, reject) => {
            const finish = (error?: Error | null) => {
                const item = this.pending.get(messageId);
                if (!item) return;
                clearTimeout(item.timer);
                this.pending.delete(messageId);
                if (error) reject(error);
                else resolve();
            };
            const timer = setTimeout(() => {
                finish(new Error("PUBLISH_CONFIRM_TIMEOUT"));
                void this.channel.close().catch(() => {});
            }, 10000);
            this.pending.set(messageId, { reject: finish, timer });
            try {
                this.channel.publish(exchange, routingKey, content, {
                    ...properties,
                    messageId,
                    persistent: true,
                    mandatory: true,
                    expiration: undefined,
                    userId: undefined,
                    replyTo: undefined,
                }, finish);
            } catch {
                finish(new Error("PUBLISH_FAILED"));
            }
        });
    }
}
