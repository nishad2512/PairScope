import Redis from "ioredis";
import { config } from "@/config/env";

export const pubClient = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    commandTimeout: 3000,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
});

export const subClient = pubClient.duplicate();

for (const client of [pubClient, subClient]) {
    client.on("error", () => {
        console.error("Realtime Redis connection unavailable");
    });
}

let closing = false;

export const isRedisReady = (): boolean => {
    return (
        !closing && pubClient.status === "ready" && subClient.status === "ready"
    );
};

export const connectRedis = async (): Promise<void> => {
    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
    } catch (error) {
        pubClient.disconnect();
        subClient.disconnect();
        throw error;
    }
};

export const closeRedis = async (): Promise<void> => {
    closing = true;

    await Promise.allSettled([pubClient.quit(), subClient.quit()]);

    pubClient.disconnect();
    subClient.disconnect();
};
