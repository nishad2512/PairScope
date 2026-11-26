import { randomUUID } from "node:crypto";
import { RealtimeServer, RealtimeSocket } from "../types/events";
import { SocketError } from "../utils/errors";
import {
    sessionSchema,
    messageSchema,
    presenceSchema,
    documentSchema,
} from "../validator/session.validator";
import { DocumentStore, SessionAuthorizer } from "../interfaces/realtime.interface";
import { createSessionMembership, sessionRoom } from "../services/session-membership";
import { createEventRunner } from "../utils/event-runner";

export const registerSessionHandlers = (
    io: RealtimeServer,
    socket: RealtimeSocket,
    documents: DocumentStore,
    authorizeSession: SessionAuthorizer,
    ready: () => boolean,
): void => {
    const { checkConnection, leave, getMember } = createSessionMembership(
        io,
        socket,
        authorizeSession,
    );
    const run = createEventRunner(socket, ready);

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
        await socket.join(sessionRoom(sessionId));

        try {
            const [document, peers] = await Promise.all([
                documents.document(sessionId),
                io.in(sessionRoom(sessionId)).fetchSockets(),
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
                socket.to(sessionRoom(sessionId)).emit("session:participant-joined", {
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
            io.to(sessionRoom(sessionId)).emit("session:message", message);
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
            const revision = await documents.apply(sessionId, update);
            io.to(sessionRoom(sessionId)).emit("document:update", {
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
                socket.to(sessionRoom(update.sessionId)).volatile.emit("presence:update", {
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
