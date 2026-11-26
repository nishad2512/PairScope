import { connect, ChannelModel } from "amqplib";
import { Pool } from "pg";
import { config } from "../config/env";
import { EmailConsumer } from "../consumers/email.consumer";
import { SmtpProvider } from "../providers/smtp.provider";
import { PostgresDeliveryRepository } from "../repositories/delivery.repository";
import { EmailService } from "../services/email.service";
import { ConfirmedPublisher } from "./publisher";
import { declareTopology } from "./topology";

export async function runEmailWorker(db: Pool, signal: AbortSignal): Promise<void> {
    let connection: ChannelModel | undefined;
    let consumer: EmailConsumer | undefined;
    const provider = new SmtpProvider({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        requireTLS: config.SMTP_REQUIRE_TLS,
        user: config.SMTP_USER,
        password: config.SMTP_PASSWORD,
        from: config.EMAIL_FROM,
    });
    let closing = false;
    const close = () => {
        if (closing) return;
        closing = true;
        void connection?.close().catch(() => {});
    };
    let shutdownTimer: NodeJS.Timeout | undefined;
    const shutdown = () => {
        shutdownTimer = setTimeout(close, config.SHUTDOWN_TIMEOUT_MS);
        if (consumer) void consumer.stop().finally(close);
        else close();
    };

    try {
        await db.query("SELECT event_id, event_hash, lease_id FROM email_deliveries LIMIT 0");
        if (signal.aborted) return;
        const brokerUrl = new URL(config.RABBITMQ_URL);
        brokerUrl.searchParams.set("heartbeat", "15");
        connection = await connect(brokerUrl.href, { timeout: 10000 });
        const disconnected = new Promise<void>((resolve) => connection!.once("close", resolve));
        connection.on("error", () => console.error(JSON.stringify({ action: "rabbitmq.connection.failed" })));
        signal.addEventListener("abort", shutdown, { once: true });
        if (signal.aborted) return;

        const publisherChannel = await connection.createConfirmChannel();
        const consumerChannel = await connection.createChannel();
        for (const channel of [publisherChannel, consumerChannel]) {
            channel.on("error", close);
            channel.on("close", close);
        }
        await declareTopology(publisherChannel, config.EMAIL_RETRY_DELAYS_MS);
        const deliveries = new PostgresDeliveryRepository(db, config.DELIVERY_LEASE_MS);
        const email = new EmailService(provider, deliveries, config.FRONTEND_URL);
        consumer = new EmailConsumer(
            consumerChannel,
            new ConfirmedPublisher(publisherChannel),
            email,
            config.EMAIL_RETRY_DELAYS_MS,
            close,
        );
        await consumer.start(config.EMAIL_PREFETCH);
        console.info(JSON.stringify({ action: "email.worker.ready" }));
        await disconnected;
    } finally {
        signal.removeEventListener("abort", shutdown);
        if (shutdownTimer) clearTimeout(shutdownTimer);
        if (consumer) await consumer.stop();
        provider.close();
        close();
    }
}
