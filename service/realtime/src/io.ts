import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { container } from "tsyringe";
import { config } from "@/config/env";
import { connectRedis, closeRedis, pubClient, subClient } from "@/config/redis";
import { SessionController } from "@/controllers/session.controller";
import { socketAuthMiddleware } from "@/middlewares/socketAuth.middleware";
import registerSessionRoutes from "@/routes/session.routes";
import {
    ClientEvents,
    RealtimeServer,
    ServerEvents,
    SocketData,
} from "@/types/socket.types";

export const initSocket = async (
    httpServer: HttpServer,
): Promise<RealtimeServer> => {
    await connectRedis();

    const io = new Server<
        ClientEvents,
        ServerEvents,
        Record<string, never>,
        SocketData
    >(httpServer, {
        path: "/socket.io",
        maxHttpBufferSize: 128 * 1024,
        serveClient: false,
        cors: {
            origin: config.CLIENT_URL,
            methods: ["GET", "POST"],
            credentials: true,
        },
        allowRequest: (request, callback) => {
            const origin = request.headers.origin;
            callback(null, !origin || config.CLIENT_URL.includes(origin));
        },
    });

    io.adapter(
        createAdapter(pubClient, subClient, {
            key: "rt:socket.io",
            requestsTimeout: 3000,
            publishOnSpecificResponseChannel: true,
        }),
    );

    for (const client of [pubClient, subClient]) {
        client.on("close", () => {
            for (const socket of io.sockets.sockets.values()) {
                socket.conn.close();
            }
        });
    }

    const controller = container.resolve(SessionController);

    io.use(socketAuthMiddleware);
    io.use(controller.authorize.bind(controller));

    io.on("connection", (socket) => {
        registerSessionRoutes(io, socket);
        controller.connect(socket);
    });

    return io;
};

export const closeSocket = async (io: RealtimeServer): Promise<void> => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await closeRedis();
};
