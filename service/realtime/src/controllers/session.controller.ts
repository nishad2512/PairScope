import { inject, injectable } from "tsyringe";
import { isRedisReady } from "@/config/redis";
import { IRealtimeService } from "@/interfaces/realtime.interface";
import { IJoinedSession, IMessage } from "@/interfaces/session.interface";
import {
    IRealtimeError,
    RealtimeServer,
    RealtimeSocket,
} from "@/types/socket.types";
import {
    DocumentDTO,
    MessageDTO,
    PresenceDTO,
    SessionDTO,
} from "@/validators/session.validator";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";
import errHandler, { getSocketError } from "@/middlewares/err-handler";

@injectable()
export class SessionController {
    constructor(
        @inject("IRealtimeService") private readonly serv: IRealtimeService,
    ) {}

    async authorize(
        socket: RealtimeSocket,
        next: (error?: Error) => void,
    ): Promise<void> {
        try {
            if (!isRedisReady()) {
                throw new AppError(
                    SocketCode.ServiceUnavailable,
                    "Realtime is unavailable.",
                );
            }

            await this.serv.reserveConnection(socket);
            next();
        } catch (error) {
            const result = getSocketError(error);
            const connectionError = new Error(result.message) as Error & {
                data: IRealtimeError;
            };
            connectionError.data = result;

            next(connectionError);
        }
    }

    connect(socket: RealtimeSocket): void {
        const expiration = setTimeout(
            () => {
                errHandler(
                    new AppError(
                        SocketCode.Unauthorized,
                        "Your token has expired. Reconnect with a fresh token.",
                    ),
                    socket,
                );
                socket.disconnect(true);
            },
            Math.max(0, socket.data.identity.expiresAt - Date.now()),
        );

        const heartbeat = setInterval(() => {
            this.serv.refreshConnection(socket).catch((error) => {
                errHandler(error, socket);
                socket.conn.close();
            });
        }, 15_000);

        expiration.unref();
        heartbeat.unref();

        socket.on("disconnect", () => {
            clearTimeout(expiration);
            clearInterval(heartbeat);

            this.serv.releaseConnection(socket).catch(() => {
                console.error(
                    "Failed to release realtime connection; its lease will expire",
                );
            });
        });
    }

    async join(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: SessionDTO,
    ): Promise<IJoinedSession> {
        return await this.serv.join(io, socket, dto.sessionId);
    }

    async leave(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: SessionDTO,
    ): Promise<{ sessionId: string }> {
        if (socket.data.membership?.sessionId === dto.sessionId) {
            await this.serv.leave(io, socket);
        }

        return { sessionId: dto.sessionId };
    }

    async message(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: MessageDTO,
    ): Promise<IMessage> {
        return await this.serv.sendMessage(io, socket, dto);
    }

    async updateDocument(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: DocumentDTO,
    ): Promise<{ revision: number }> {
        return await this.serv.updateDocument(io, socket, dto);
    }

    async updatePresence(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: PresenceDTO,
    ): Promise<{ sessionId: string }> {
        return await this.serv.updatePresence(io, socket, dto);
    }

    async disconnect(
        io: RealtimeServer,
        socket: RealtimeSocket,
    ): Promise<void> {
        await this.serv.leave(io, socket);
    }
}
