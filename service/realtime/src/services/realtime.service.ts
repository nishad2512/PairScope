import { randomUUID } from "node:crypto";
import { inject, injectable } from "tsyringe";
import {
    IDocumentService,
    IRealtimeRepository,
    IRealtimeService,
} from "@/interfaces/realtime.interface";
import {
    IJoinedSession,
    IMessage,
    IPresence,
    ISessionAccess,
    ISessionService,
} from "@/interfaces/session.interface";
import { RealtimeServer, RealtimeSocket } from "@/types/socket.types";
import {
    DocumentDTO,
    MessageDTO,
    PresenceDTO,
} from "@/validators/session.validator";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";

@injectable()
export class RealtimeService implements IRealtimeService {
    constructor(
        @inject("IRealtimeRepository")
        private readonly repo: IRealtimeRepository,
        @inject("ISessionService")
        private readonly sessionServ: ISessionService,
        @inject("IDocumentService") private readonly docServ: IDocumentService,
    ) {}

    async join(
        io: RealtimeServer,
        socket: RealtimeSocket,
        sessionId: string,
    ): Promise<IJoinedSession> {
        const access = await this.sessionServ.authorize(
            sessionId,
            socket.data.identity,
        );
        this.checkConnection(socket);

        const repeated = socket.data.membership?.sessionId === sessionId;
        if (!repeated) {
            await this.leave(io, socket);
        }

        this.checkConnection(socket);

        socket.data.membership = access;
        socket.data.authorizedAt = Date.now();
        const roomName = `session:${sessionId}`;
        await socket.join(roomName);

        try {
            const [document, peers] = await Promise.all([
                this.docServ.getDocument(sessionId),
                io.in(roomName).fetchSockets(),
            ]);

            this.checkConnection(socket);

            const participants: IPresence[] = [];
            for (const peer of peers) {
                const membership = peer.data.membership;
                if (!membership || membership.sessionId !== sessionId) {
                    continue;
                }

                participants.push({
                    ...membership.participant,
                    socketId: peer.id,
                    isGuest: !!peer.data.identity.sessionId,
                });
            }

            const joined = { ...access, participants, document };
            socket.emit("session:joined", joined);

            if (!repeated) {
                socket.to(roomName).emit("session:participant-joined", {
                    ...access.participant,
                    socketId: socket.id,
                    isGuest: !!socket.data.identity.sessionId,
                    sessionId,
                });
            }

            return joined;
        } catch (error) {
            await this.leave(io, socket, repeated);
            throw error;
        }
    }

    async leave(
        io: RealtimeServer,
        socket: RealtimeSocket,
        notify = true,
    ): Promise<void> {
        const access = socket.data.membership;
        if (!access) {
            return;
        }

        delete socket.data.membership;
        delete socket.data.authorizedAt;

        const roomName = `session:${access.sessionId}`;
        await socket.leave(roomName);

        if (notify) {
            io.to(roomName).emit("session:participant-left", {
                sessionId: access.sessionId,
                socketId: socket.id,
                participantId: access.participant.id,
                userId: access.participant.userId,
            });
        }
    }

    private async getMember(
        io: RealtimeServer,
        socket: RealtimeSocket,
        sessionId: string,
    ): Promise<ISessionAccess> {
        const access = socket.data.membership;
        if (
            !access ||
            access.sessionId !== sessionId ||
            !socket.rooms.has(`session:${sessionId}`)
        ) {
            throw new AppError(
                SocketCode.NotJoined,
                "Join this session before sending events.",
            );
        }

        if (access.expiresAt && Date.parse(access.expiresAt) <= Date.now()) {
            await this.leave(io, socket);
            throw new AppError(
                SocketCode.SessionClosed,
                "This session has expired.",
            );
        }

        if (Date.now() - (socket.data.authorizedAt || 0) >= 5000) {
            try {
                const verified = await this.sessionServ.authorize(
                    sessionId,
                    socket.data.identity,
                );
                this.checkConnection(socket);

                socket.data.membership = verified;
                socket.data.authorizedAt = Date.now();

                return verified;
            } catch (error) {
                if (
                    error instanceof AppError &&
                    (error.statusCode === SocketCode.Forbidden ||
                        error.statusCode === SocketCode.SessionClosed)
                ) {
                    await this.leave(io, socket);
                }

                throw error;
            }
        }

        return access;
    }

    async sendMessage(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: MessageDTO,
    ): Promise<IMessage> {
        const access = await this.getMember(io, socket, dto.sessionId);
        const message = {
            id: randomUUID(),
            sessionId: dto.sessionId,
            senderId: access.participant.userId || access.participant.id,
            participantId: access.participant.id,
            displayName: access.participant.displayName,
            isGuest: !!socket.data.identity.sessionId,
            content: dto.content,
            timestamp: new Date().toISOString(),
        };

        io.to(`session:${dto.sessionId}`).emit("session:message", message);

        return message;
    }

    async updateDocument(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: DocumentDTO,
    ): Promise<{ revision: number }> {
        const access = await this.getMember(io, socket, dto.sessionId);
        if (access.participant.role === "OBSERVER") {
            throw new AppError(
                SocketCode.Forbidden,
                "Observers cannot edit the shared document.",
            );
        }

        const revision = await this.docServ.updateDocument(
            dto.sessionId,
            dto.update,
        );

        io.to(`session:${dto.sessionId}`).emit("document:update", {
            sessionId: dto.sessionId,
            update: dto.update,
            revision,
            participantId: access.participant.id,
        });

        return { revision };
    }

    async updatePresence(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: PresenceDTO,
    ): Promise<{ sessionId: string }> {
        const access = await this.getMember(io, socket, dto.sessionId);

        socket.to(`session:${dto.sessionId}`).volatile.emit("presence:update", {
            ...dto,
            socketId: socket.id,
            participantId: access.participant.id,
        });

        return { sessionId: dto.sessionId };
    }

    async reserveConnection(socket: RealtimeSocket): Promise<void> {
        const reserved = await this.repo.reserveConnection(
            socket.data.identity,
            socket.id,
        );
        if (!reserved) {
            throw new AppError(
                SocketCode.RateLimited,
                "At most five realtime connections are allowed per identity.",
            );
        }
    }

    async refreshConnection(socket: RealtimeSocket): Promise<void> {
        await this.reserveConnection(socket);

        const current = socket.data.membership;
        if (!current) {
            return;
        }

        const verified = await this.sessionServ.authorize(
            current.sessionId,
            socket.data.identity,
        );
        if (
            socket.connected &&
            socket.data.membership?.sessionId === current.sessionId
        ) {
            socket.data.membership = verified;
            socket.data.authorizedAt = Date.now();
        }
    }

    async releaseConnection(socket: RealtimeSocket): Promise<void> {
        await this.repo.releaseConnection(socket.data.identity, socket.id);
    }

    private checkConnection(socket: RealtimeSocket): void {
        if (!socket.connected) {
            throw new AppError(
                SocketCode.Unauthorized,
                "The connection is closed.",
            );
        }
    }
}
