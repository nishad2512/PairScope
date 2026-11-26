import { Ack, RealtimeSocket } from "../types/events";
import { SocketError, publicError } from "./errors";

export const createEventRunner = (socket: RealtimeSocket, ready: () => boolean) => {
    let queue = Promise.resolve();
    let pending = 0;
    let windowStart = Date.now();
    let events = 0;
    let presenceEvents = 0;

    // Serialize events so a join, edit, and leave cannot race on the same socket.
    return <T>(
        ack: Ack<T> | undefined,
        action: () => Promise<T>,
        isPresence = false,
    ): void => {
        const reject = (error: unknown): void => {
            const result = publicError(error);
            if (typeof ack === "function") {
                ack({ ok: false, error: result });
            } else {
                socket.emit("session:error", result);
            }
        };

        if (Date.now() - windowStart >= 1000) {
            windowStart = Date.now();
            events = 0;
            presenceEvents = 0;
        }
        events++;
        if (isPresence) {
            presenceEvents++;
        }
        if (events > 100 || (isPresence && presenceEvents > 20) || pending >= 32) {
            reject(new SocketError("RATE_LIMITED", "Too many realtime events. Please slow down."));
            return;
        }

        pending++;
        queue = queue.then(async () => {
            try {
                if (!socket.connected || socket.data.identity.expiresAt <= Date.now()) {
                    throw new SocketError(
                        "UNAUTHORIZED",
                        "Your access token has expired. Reconnect with a fresh token.",
                    );
                }
                if (!ready()) {
                    throw new SocketError(
                        "SERVICE_UNAVAILABLE",
                        "Realtime storage is unavailable. Please retry.",
                    );
                }
                const data = await action();
                if (typeof ack === "function") {
                    ack({ ok: true, data });
                }
            } catch (error) {
                reject(error);
            } finally {
                pending--;
            }
        });
    };
};
