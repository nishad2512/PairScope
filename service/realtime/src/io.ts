import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "./config";
import { socketAuthMiddleware } from "./middlewares/socketAuth.middleware";
import { registerSessionHandlers } from "./handlers/session.handler";
import { authorizeSession } from "./services/session-access";
import { RedisState } from "./services/redis-state";
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
    const state = new RedisState(pubClient);
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
            await state.reserve(socket.data.identity, socket.id);
            next();
        } catch (error) {
            const result = publicError(error);
            const connectionError = new Error(result.message) as Error & { data: typeof result };
            connectionError.data = result;
            next(connectionError);
        }
    });

    io.on("connection", (socket) => {
        const expiration = setTimeout(
            () => {
                socket.emit("session:error", {
                    code: "UNAUTHORIZED",
                    message: "Your token has expired. Reconnect with a fresh token.",
                });
                socket.disconnect(true);
            },
            Math.max(0, socket.data.identity.expiresAt - Date.now()),
        );

        const heartbeat = setInterval(async () => {
            try {
                await state.reserve(socket.data.identity, socket.id);
                const current = socket.data.membership;
                if (current) {
                    const access = await authorizeSession(current.sessionId, socket.data.identity);
                    if (
                        socket.connected &&
                        socket.data.membership?.sessionId === current.sessionId
                    ) {
                        socket.data.membership = access;
                        socket.data.authorizedAt = Date.now();
                    }
                }
            } catch (error) {
                socket.emit("session:error", publicError(error));
                socket.conn.close();
            }
        }, 15_000);

        expiration.unref();
        heartbeat.unref();
        registerSessionHandlers(io, socket, state, ready);

        socket.on("disconnect", () => {
            clearTimeout(expiration);
            clearInterval(heartbeat);
            state.release(socket.data.identity, socket.id).catch(() => {
                // Redis expires the connection lease if cleanup fails.
            });
        });
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
