import { setTimeout } from "node:timers/promises";
import { config } from "./config/env";
import { db } from "./config/db";
import { runEmailWorker } from "./messaging/worker";

const shutdown = new AbortController();
let deadline: NodeJS.Timeout | undefined;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
        shutdown.abort();
        deadline = global.setTimeout(() => process.exit(1), config.SHUTDOWN_TIMEOUT_MS + 5000);
        deadline.unref();
    });
}

async function start(): Promise<void> {
    let delay = 1000;
    try {
        while (!shutdown.signal.aborted) {
            try {
                await runEmailWorker(db, shutdown.signal);
                delay = 1000;
            } catch {
                console.error(JSON.stringify({ action: "email.worker.unavailable", retryInMs: delay }));
            }
            if (shutdown.signal.aborted) break;
            await setTimeout(delay, undefined, { signal: shutdown.signal }).catch(() => {});
            delay = Math.min(delay * 2, 30000);
        }
    } finally {
        await db.end();
        if (deadline) clearTimeout(deadline);
    }
}

void start().catch(() => {
    console.error(JSON.stringify({ action: "email.worker.stopped" }));
    process.exitCode = 1;
});
