import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { ChannelModel, connect } from "amqplib";
import { config } from "./config/env";
import { EmailConsumer } from "./consumers/email.consumer";
import { SmtpProvider } from "./providers/smtp.provider";
import { EmailService } from "./services/email.service";
import { declareTopology } from "./messaging/topology";

let stopping = false;
let connection: ChannelModel | undefined;
let consumer: EmailConsumer | undefined;

async function stop(): Promise<void> {
    stopping = true;
    const timeout = setTimeout(
        () => process.exit(1),
        config.SHUTDOWN_TIMEOUT_MS,
    );
    timeout.unref();
    await consumer?.stop();
    await connection?.close().catch(() => {});
}

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());

async function start(): Promise<void> {
    const provider = new SmtpProvider({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        requireTLS: config.SMTP_REQUIRE_TLS,
        user: config.SMTP_USER,
        password: config.SMTP_PASSWORD,
        from: config.EMAIL_FROM,
    });
    const email = new EmailService(provider, config.FRONTEND_URL);

    while (!stopping) {
        try {
            connection = await connect(config.RABBITMQ_URL, { timeout: 10000 });
            connection.on("error", () =>
                console.error("RabbitMQ connection failed"),
            );
            const disconnected = once(connection, "close").catch(() => {});
            const publisher = await connection.createConfirmChannel();
            const channel = await connection.createChannel();
            const currentConnection = connection;
            const close = () => void currentConnection.close().catch(() => {});
            for (const item of [publisher, channel]) {
                item.on("error", close);
                item.on("close", close);
            }
            await declareTopology(publisher, config.EMAIL_RETRY_DELAYS_MS);
            consumer = new EmailConsumer(
                channel,
                publisher,
                email,
                config.EMAIL_RETRY_DELAYS_MS,
                close,
            );
            if (stopping) break;
            await consumer.start();
            console.info("Email service is listening");
            await disconnected;
        } catch {
            if (!stopping)
                console.error(
                    "Email service unavailable. Reconnecting in 5 seconds.",
                );
        } finally {
            await consumer?.stop();
            await connection?.close().catch(() => {});
            consumer = undefined;
            connection = undefined;
        }
        if (!stopping) await delay(5000);
    }
    provider.close();
}

void start().catch(() => {
    console.error("Email service stopped unexpectedly");
    process.exitCode = 1;
});
