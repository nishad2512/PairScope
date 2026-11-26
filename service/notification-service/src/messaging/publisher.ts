import { ConfirmChannel } from "amqplib";

// The email consumer sends one message at a time through this channel.
export function publishEmail(
    channel: ConfirmChannel,
    exchange: string,
    routingKey: string,
    content: Buffer,
    attempt: number,
    failure: string,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const finish = (error?: Error | null) => {
            clearTimeout(timeout);
            channel.off("return", returned);
            channel.off("close", closed);
            if (error) reject(error);
            else resolve();
        };
        const returned = () => finish(new Error("Email message could not be routed"));
        const closed = () => finish(new Error("Email publisher channel closed"));
        const timeout = setTimeout(() => {
            finish(new Error("Email publisher confirmation timed out"));
            void channel.close().catch(() => {});
        }, 10000);

        channel.once("return", returned);
        channel.once("close", closed);
        try {
            channel.publish(exchange, routingKey, content, {
                persistent: true,
                mandatory: true,
                contentType: "application/json",
                headers: { "x-retry-attempt": attempt, "x-failure-code": failure },
            }, finish);
        } catch {
            finish(new Error("Email publication failed"));
        }
    });
}
