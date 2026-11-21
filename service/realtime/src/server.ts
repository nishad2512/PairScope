import "dotenv/config";
import "reflect-metadata";
import "@/utils/container";
import express from "express";
import { createServer } from "http";
import { config } from "@/config/env";
import { isRedisReady } from "@/config/redis";
import { closeSocket, initSocket } from "@/io";
import { StatusCode } from "@/utils/StatusEnum";

const app = express();
const httpServer = createServer(app);
const PORT = config.PORT;

app.disable("x-powered-by");

app.get("/health", (_req, res) => {
    const ready = isRedisReady();

    res.status(ready ? StatusCode.Ok : StatusCode.ServiceUnavailable).json({
        status: ready ? "ok" : "unavailable",
        service: "realtime-service",
    });
});

const startServer = async (): Promise<void> => {
    const io = await initSocket(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Realtime service running on port ${PORT}`);
    });

    let stopping = false;
    const stopServer = (): void => {
        if (stopping) {
            return;
        }

        stopping = true;
        const deadline = setTimeout(() => process.exit(1), 5000);
        deadline.unref();

        closeSocket(io)
            .then(() => {
                clearTimeout(deadline);
            })
            .catch(() => {
                process.exit(1);
            });
    };

    process.once("SIGINT", stopServer);
    process.once("SIGTERM", stopServer);
};

startServer().catch(() => {
    console.error(
        "Realtime startup failed. Check configuration and Redis availability.",
    );
    process.exitCode = 1;
});
