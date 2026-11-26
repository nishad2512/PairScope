import { RealtimeServer, RealtimeSocket } from "../types/events";
import { ConnectionLease, DocumentStore, SessionAuthorizer } from "../interfaces/realtime.interface";
import { registerSessionHandlers } from "./session.handler";
import { publicError } from "../utils/errors";

export const registerConnectionHandlers = (
    io: RealtimeServer,
    socket: RealtimeSocket,
    documents: DocumentStore,
    connections: ConnectionLease,
    authorizeSession: SessionAuthorizer,
    ready: () => boolean,
): void => {
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
            await connections.reserve(socket.data.identity, socket.id);
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
    registerSessionHandlers(io, socket, documents, authorizeSession, ready);

    socket.on("disconnect", () => {
        clearTimeout(expiration);
        clearInterval(heartbeat);
        connections.release(socket.data.identity, socket.id).catch(() => {
            // Redis expires the connection lease if cleanup fails.
        });
    });
};
