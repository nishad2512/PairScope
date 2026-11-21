import { randomUUID } from "node:crypto";
import z from "zod";
import { Ack, RealtimeServer, RealtimeSocket, SessionAccess } from "../types/events";
import { authorizeSession } from "../services/session-access";
import { RedisState } from "../services/redis-state";
import { SocketError, publicError } from "../utils/errors";

const sessionSchema = z.union([
    z.uuid().transform((sessionId) => ({ sessionId })),
    z.object({ sessionId: z.uuid() }).strict(),
]);
const messageSchema = z
    .object({
        sessionId: z.uuid(),
        content: z.string().trim().min(1).max(4000),
    })
    .strict();
const position = z.number().int().positive().max(1_000_000);
const presenceSchema = z
    .object({
        sessionId: z.uuid(),
        cursor: z.object({ lineNumber: position, column: position }).strict().nullable(),
        selection: z
            .object({
                startLineNumber: position,
                startColumn: position,
                endLineNumber: position,
                endColumn: position,
            })
            .strict()
            .nullable()
            .optional(),
    })
    .strict();
const documentSchema = z
    .object({
        sessionId: z.uuid(),
        update: z
            .instanceof(Uint8Array)
            .refine((value) => value.byteLength > 0 && value.byteLength <= 64 * 1024),
    })
    .strict();
const room = (sessionId: string) => `session:${sessionId}`;

export const registerSessionHandlers = (
    io: RealtimeServer,
    socket: RealtimeSocket,
    state: RedisState,
    ready: () => boolean,
): void => {
    let queue = Promise.resolve();
    let pending = 0;
    let windowStart = Date.now();
    let events = 0;
    let presenceEvents = 0;

    const checkConnection = (): void => {
        if (!socket.connected) {
            throw new SocketError("UNAUTHORIZED", "The connection is closed.");
        }
    };

    const leave = async (notify = true): Promise<void> => {
        const access = socket.data.membership;
        if (!access) {
            return;
        }

        delete socket.data.membership;
        delete socket.data.authorizedAt;
        await socket.leave(room(access.sessionId));

        if (notify) {
            io.to(room(access.sessionId)).emit("session:participant-left", {
                sessionId: access.sessionId,
                socketId: socket.id,
                participantId: access.participant.id,
                userId: access.participant.userId,
            });
        }
    };

    const getMember = async (sessionId: string): Promise<SessionAccess> => {
        const access = socket.data.membership;
        if (!access || access.sessionId !== sessionId || !socket.rooms.has(room(sessionId))) {
            throw new SocketError("NOT_JOINED", "Join this session before sending events.");
        }
        if (access.expiresAt && Date.parse(access.expiresAt) <= Date.now()) {
            await leave();
            throw new SocketError("SESSION_CLOSED", "This session has expired.");
        }

        if (Date.now() - (socket.data.authorizedAt || 0) < 5000) {
            return access;
        }

        try {
            const verified = await authorizeSession(sessionId, socket.data.identity);
            checkConnection();
            socket.data.membership = verified;
            socket.data.authorizedAt = Date.now();
            return verified;
        } catch (error) {
            if (
                error instanceof SocketError &&
                ["FORBIDDEN", "SESSION_CLOSED"].includes(error.code)
            ) {
                await leave();
            }
            throw error;
        }
    };

    const join = async (sessionId: string) => {
        const access = await authorizeSession(sessionId, socket.data.identity);
        checkConnection();

        const repeated = socket.data.membership?.sessionId === sessionId;
        if (!repeated) {
            await leave();
        }

        checkConnection();
        socket.data.membership = access;
        socket.data.authorizedAt = Date.now();
        await socket.join(room(sessionId));

        try {
            const [document, peers] = await Promise.all([
                state.document(sessionId),
                io.in(room(sessionId)).fetchSockets(),
            ]);
            checkConnection();

            const participants = [];
            for (const peer of peers) {
                if (peer.data.membership?.sessionId === sessionId) {
                    participants.push({
                        ...peer.data.membership.participant,
                        socketId: peer.id,
                        isGuest: !!peer.data.identity.sessionId,
                    });
                }
            }

            const joined = { ...access, participants, document };
            socket.emit("session:joined", joined);
            if (!repeated) {
                socket.to(room(sessionId)).emit("session:participant-joined", {
                    ...access.participant,
                    sessionId,
                    socketId: socket.id,
                    isGuest: !!socket.data.identity.sessionId,
                });
            }
            return joined;
        } catch (error) {
            await leave(repeated);
            throw error;
        }
    };

    // Serialize events so a join, edit, and leave cannot race on the same socket.
    const run = <T>(
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

    socket.on("session:join", (payload, ack) => {
        run(ack, () => join(sessionSchema.parse(payload).sessionId));
    });

    socket.on("session:leave", (payload, ack) => {
        run(ack, async () => {
            const { sessionId } = sessionSchema.parse(payload);
            if (socket.data.membership?.sessionId === sessionId) {
                await leave();
            }
            return { sessionId };
        });
    });

    socket.on("session:message", (payload, ack) => {
        run(ack, async () => {
            const { sessionId, content } = messageSchema.parse(payload);
            const { participant } = await getMember(sessionId);
            const message = {
                id: randomUUID(),
                sessionId,
                senderId: participant.userId || participant.id,
                participantId: participant.id,
                displayName: participant.displayName,
                isGuest: !!socket.data.identity.sessionId,
                content,
                timestamp: new Date().toISOString(),
            };
            io.to(room(sessionId)).emit("session:message", message);
            return message;
        });
    });

    socket.on("document:update", (payload, ack) => {
        run(ack, async () => {
            const { sessionId, update } = documentSchema.parse(payload);
            const { participant } = await getMember(sessionId);
            if (participant.role === "OBSERVER") {
                throw new SocketError("FORBIDDEN", "Observers cannot edit the shared document.");
            }
            const revision = await state.apply(sessionId, update);
            io.to(room(sessionId)).emit("document:update", {
                sessionId,
                update,
                revision,
                participantId: participant.id,
            });
            return { revision };
        });
    });

    socket.on("presence:update", (payload, ack) => {
        run(
            ack,
            async () => {
                const update = presenceSchema.parse(payload);
                const { participant } = await getMember(update.sessionId);
                socket.to(room(update.sessionId)).volatile.emit("presence:update", {
                    ...update,
                    socketId: socket.id,
                    participantId: participant.id,
                });
                return { sessionId: update.sessionId };
            },
            true,
        );
    });

    socket.on("disconnecting", () => {
        leave().catch(() => {
            // Socket.IO still removes the disconnected socket from its rooms.
        });
    });
};
