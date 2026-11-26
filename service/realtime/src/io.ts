import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "./config";
import { socketAuthMiddleware } from "./middlewares/socketAuth.middleware";
import { registerConnectionHandlers } from "./handlers/connection.handler";
import { authorizeSession } from "./services/session-access";
import { RedisDocumentStore } from "./services/redis-documents";
import { RedisConnectionLease } from "./services/redis-connections";
import { publicError } from "./utils/errors";
import { ClientEvents, ServerEvents, SocketData } from "./types/events";

export const initSocket = async (httpServer: HttpServer) => {
    const pubClient = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        enableOfflineQueue: false,
        commandTimeout: 3000,
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
    });
    const subClient = pubClient.duplicate();

    for (const client of [pubClient, subClient]) {
        client.on("error", () => console.error("Realtime Redis connection unavailable"));
    }

    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
    } catch (error) {
        pubClient.disconnect();
        subClient.disconnect();
        throw error;
    }

    let closing = false;
    const ready = () => !closing && pubClient.status === "ready" && subClient.status === "ready";
    const documents = new RedisDocumentStore(pubClient);
    const connections = new RedisConnectionLease(pubClient);
    const io = new Server<ClientEvents, ServerEvents, Record<string, never>, SocketData>(
        httpServer,
        {
            path: "/socket.io",
            maxHttpBufferSize: 128 * 1024,
            serveClient: false,
            cors: { origin: config.CLIENT_URL, methods: ["GET", "POST"], credentials: true },
            allowRequest: (req, callback) => {
                callback(
                    null,
                    !req.headers.origin || config.CLIENT_URL.includes(req.headers.origin),
                );
            },
        },
    );

    io.adapter(
        createAdapter(pubClient, subClient, {
            key: "rt:socket.io",
            requestsTimeout: 3000,
            publishOnSpecificResponseChannel: true,
        }),
    );

    for (const client of [pubClient, subClient]) {
        client.on("close", () => {
            if (!closing) {
                for (const socket of io.sockets.sockets.values()) {
                    socket.conn.close();
                }
            }
        });
    }

    io.use(socketAuthMiddleware);
    io.use(async (socket, next) => {
        try {
            if (!ready()) {
                throw new Error("Redis is unavailable");
            }
            await connections.reserve(socket.data.identity, socket.id);
            next();
        } catch (error) {
            const result = publicError(error);
            const connectionError = new Error(result.message) as Error & { data: typeof result };
            connectionError.data = result;
            next(connectionError);
        }
    });

    io.on("connection", (socket) => {
        registerConnectionHandlers(io, socket, documents, connections, authorizeSession, ready);
    });

    return {
        ready,
        async close(): Promise<void> {
            closing = true;
            await new Promise<void>((resolve) => io.close(() => resolve()));
            await Promise.allSettled([pubClient.quit(), subClient.quit()]);
            pubClient.disconnect();
            subClient.disconnect();
        },
    };
};
