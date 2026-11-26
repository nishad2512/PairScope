import { Channel } from "amqplib";

export const exchanges = {
    events: "pairscope.events",
    delivery: "pairscope.notification.delivery",
    retry: "pairscope.notification.retry",
    dead: "pairscope.notification.dead",
};

export const queues = {
    email: "notification.email",
    dead: "notification.email.dlq",
};

export const emailEvents = [
    "session.invitation.created.v1",
    "organization.invitation.created.v1",
    "email.requested.v1",
] as const;

export const retryKey = (index: number) => `email.retry.${index + 1}`;
export const retryQueue = (delay: number) =>
    `notification.email.retry.${delay}ms`;

export async function declareTopology(
    channel: Channel,
    delays: number[],
): Promise<void> {
    await channel.assertExchange(exchanges.events, "topic", { durable: true });
    for (const exchange of [
        exchanges.delivery,
        exchanges.retry,
        exchanges.dead,
    ]) {
        await channel.assertExchange(exchange, "direct", { durable: true });
    }

    const safeDeadLettering = {
        "x-queue-type": "quorum",
        "x-overflow": "reject-publish",
        "x-dead-letter-strategy": "at-least-once",
        "x-max-length-bytes": 64 * 1024 * 1024,
    };
    await channel.assertQueue(queues.dead, {
        durable: true,
        arguments: {
            "x-queue-type": "quorum",
            "x-overflow": "reject-publish",
            "x-max-length-bytes": 64 * 1024 * 1024,
        },
    });
    await channel.bindQueue(queues.dead, exchanges.dead, "email");
    await channel.assertQueue(queues.email, {
        durable: true,
        arguments: {
            ...safeDeadLettering,
            "x-dead-letter-exchange": exchanges.dead,
            "x-dead-letter-routing-key": "email",
            "x-delivery-limit": 20,
        },
    });
    for (const event of emailEvents) {
        await channel.bindQueue(queues.email, exchanges.events, event);
    }
    await channel.bindQueue(queues.email, exchanges.delivery, "email");

    for (const [index, delay] of delays.entries()) {
        const queue = retryQueue(delay);
        await channel.assertQueue(queue, {
            durable: true,
            arguments: {
                ...safeDeadLettering,
                "x-message-ttl": delay,
                "x-dead-letter-exchange": exchanges.delivery,
                "x-dead-letter-routing-key": "email",
            },
        });
        await channel.bindQueue(queue, exchanges.retry, retryKey(index));
    }
}
