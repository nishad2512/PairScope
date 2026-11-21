import { Server, Socket } from "socket.io";
import {
    IIdentity,
    ISessionAccess,
    IPresence,
    IJoinedSession,
    IPresenceUpdate,
    IMessage,
} from "@/interfaces/session.interface";
import { SocketCode } from "@/utils/StatusEnum";

export interface IRealtimeError {
    code: SocketCode;
    message: string;
}

export type Result<T> =
    { ok: true; data: T } | { ok: false; error: IRealtimeError };

export type Ack<T> = (result: Result<T>) => void;

export type SessionRef = { sessionId: string } | string;

export interface ClientEvents {
    "session:join": (payload: SessionRef, ack?: Ack<IJoinedSession>) => void;
    "session:leave": (
        payload: SessionRef,
        ack?: Ack<{ sessionId: string }>,
    ) => void;
    "session:message": (
        payload: { sessionId: string; content: string },
        ack?: Ack<IMessage>,
    ) => void;
    "document:update": (
        payload: { sessionId: string; update: Uint8Array },
        ack?: Ack<{ revision: number }>,
    ) => void;
    "presence:update": (
        payload: IPresenceUpdate,
        ack?: Ack<{ sessionId: string }>,
    ) => void;
}
export interface ServerEvents {
    "session:joined": (payload: IJoinedSession) => void;
    "session:participant-joined": (
        payload: IPresence & { sessionId: string },
    ) => void;
    "session:participant-left": (payload: {
        sessionId: string;
        socketId: string;
        participantId: string;
        userId: string | null;
    }) => void;
    "session:message": (payload: IMessage) => void;
    "session:error": (error: IRealtimeError) => void;
    "document:update": (payload: {
        sessionId: string;
        update: Uint8Array;
        revision: number;
        participantId: string;
    }) => void;
    "presence:update": (
        payload: IPresenceUpdate & { socketId: string; participantId: string },
    ) => void;
}
export interface SocketData {
    identity: IIdentity;
    membership?: ISessionAccess;
    authorizedAt?: number;
}
export type RealtimeServer = Server<
    ClientEvents,
    ServerEvents,
    Record<string, never>,
    SocketData
>;
export type RealtimeSocket = Socket<
    ClientEvents,
    ServerEvents,
    Record<string, never>,
    SocketData
>;
