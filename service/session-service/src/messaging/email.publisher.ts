import { connect } from "amqplib";
import { injectable } from "tsyringe";
import { IEmailPublisher, InvitationEmail } from "@/interfaces/email.interface";
import { toInvitationEmail } from "@/mappers/invitation-email.mapper";
import { emailConfigSchema } from "@/validators/email.validator";

@injectable()
export class EmailPublisher implements IEmailPublisher {
    async publishInvitation(email: InvitationEmail): Promise<void> {
        const config = emailConfigSchema.parse(process.env);
        const event = toInvitationEmail(email, config.FRONTEND_URL);
        const connection = await connect(config.RABBITMQ_URL, { timeout: 5000 });
        connection.on("error", () => console.error("Invitation email connection failed"));

        try {
            const channel = await connection.createConfirmChannel();
            channel.on("error", () => console.error("Invitation email publisher failed"));
            await channel.assertExchange("pairscope.events", "topic", { durable: true });

            await new Promise<void>((resolve, reject) => {
                const finish = (error?: Error | null) => {
                    clearTimeout(timeout);
                    if (error) reject(error);
                    else resolve();
                };
                const timeout = setTimeout(() => {
                    finish(new Error("Invitation email confirmation timed out"));
                    void connection.close().catch(() => {});
                }, 5000);
                channel.once("return", () => finish(new Error("No email queue is available")));
                channel.once("close", () => finish(new Error("Invitation email channel closed")));
                channel.publish("pairscope.events", event.type, Buffer.from(JSON.stringify(event)), {
                    persistent: true,
                    mandatory: true,
                    contentType: "application/json",
                    messageId: event.eventId,
                }, finish);
            });
        } finally {
            await connection.close().catch(() => {});
        }
    }
}
