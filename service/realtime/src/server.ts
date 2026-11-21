import express from "express";
import { createServer } from "http";
import { config } from "./config";
import { initSocket } from "./io";

const app = express();
const httpServer = createServer(app);
const PORT = config.PORT;

app.disable("x-powered-by");

const startServer = async (): Promise<void> => {
    const realtime = await initSocket(httpServer);

    app.get("/health", (_req, res) => {
        const ready = realtime.ready();
        res.status(ready ? 200 : 503).json({
            status: ready ? "ok" : "unavailable",
            service: "realtime-service",
        });
    });

    httpServer.listen(PORT, () => {
        console.log(`Realtime service running on port ${PORT}`);
    });

    let stopping = false;
    const stopServer = async (): Promise<void> => {
        if (stopping) {
            return;
        }

        stopping = true;
        const deadline = setTimeout(() => process.exit(1), 5000);
        deadline.unref();

        try {
            await realtime.close();
            clearTimeout(deadline);
        } catch {
            process.exit(1);
        }
    };

    process.once("SIGINT", stopServer);
    process.once("SIGTERM", stopServer);
};

startServer().catch(() => {
    console.error("Realtime startup failed. Check configuration and Redis availability.");
    process.exitCode = 1;
});
