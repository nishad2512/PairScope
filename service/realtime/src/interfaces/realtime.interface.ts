import {
    IDocumentState,
    IIdentity,
    IJoinedSession,
    IMessage,
} from "@/interfaces/session.interface";
import { RealtimeServer, RealtimeSocket } from "@/types/socket.types";
import {
    DocumentDTO,
    MessageDTO,
    PresenceDTO,
} from "@/validators/session.validator";

export interface IRealtimeRepository {
    getDocument(sessionId: string): Promise<IDocumentState>;
    saveDocument(sessionId: string, document: IDocumentState): Promise<number>;
    reserveConnection(identity: IIdentity, socketId: string): Promise<boolean>;
    releaseConnection(identity: IIdentity, socketId: string): Promise<void>;
}

export interface IDocumentService {
    getDocument(sessionId: string): Promise<IDocumentState>;
    updateDocument(sessionId: string, update: Uint8Array): Promise<number>;
}

export interface IRealtimeService {
    join(
        io: RealtimeServer,
        socket: RealtimeSocket,
        sessionId: string,
    ): Promise<IJoinedSession>;
    leave(
        io: RealtimeServer,
        socket: RealtimeSocket,
        notify?: boolean,
    ): Promise<void>;
    sendMessage(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: MessageDTO,
    ): Promise<IMessage>;
    updateDocument(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: DocumentDTO,
    ): Promise<{ revision: number }>;
    updatePresence(
        io: RealtimeServer,
        socket: RealtimeSocket,
        dto: PresenceDTO,
    ): Promise<{ sessionId: string }>;
    reserveConnection(socket: RealtimeSocket): Promise<void>;
    refreshConnection(socket: RealtimeSocket): Promise<void>;
    releaseConnection(socket: RealtimeSocket): Promise<void>;
}
