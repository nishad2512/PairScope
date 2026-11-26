import { RealtimeServer, RealtimeSocket, SessionAccess } from "../types/events";
import { SessionAuthorizer } from "../interfaces/realtime.interface";
import { SocketError } from "../utils/errors";

export const sessionRoom = (sessionId: string) => `session:${sessionId}`;

export const createSessionMembership = (
    io: RealtimeServer,
    socket: RealtimeSocket,
    authorizeSession: SessionAuthorizer,
) => {
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
        await socket.leave(sessionRoom(access.sessionId));

        if (notify) {
            io.to(sessionRoom(access.sessionId)).emit("session:participant-left", {
                sessionId: access.sessionId,
                socketId: socket.id,
                participantId: access.participant.id,
                userId: access.participant.userId,
            });
        }
    };

    const getMember = async (sessionId: string): Promise<SessionAccess> => {
        const access = socket.data.membership;
        if (!access || access.sessionId !== sessionId || !socket.rooms.has(sessionRoom(sessionId))) {
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

    return { checkConnection, leave, getMember };
};
