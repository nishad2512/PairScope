import type { Server, Socket } from "socket.io";

export type ParticipantRole = "OWNER" | "INTERVIEWER" | "CANDIDATE" | "COLLABORATOR" | "OBSERVER";
export interface Identity {
    userId: string;
    sessionId?: string;
    expiresAt: number;
}
export interface Participant {
    id: string;
    userId: string | null;
    displayName: string;
    role: ParticipantRole;
}
export interface SessionAccess {
    sessionId: string;
    language: string;
    status: "live" | "scheduled";
    expiresAt: string | null;
    participant: Participant;
}
export interface Presence extends Participant {
    socketId: string;
    isGuest: boolean;
}
export interface DocumentState {
    update: Uint8Array;
    revision: number;
}
export interface Joined extends SessionAccess {
    participants: Presence[];
    document: DocumentState;
}
export type ErrorCode =
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "SESSION_CLOSED"
    | "NOT_JOINED"
    | "INVALID_PAYLOAD"
    | "RATE_LIMITED"
    | "SERVICE_UNAVAILABLE"
    | "DOCUMENT_TOO_LARGE";
export interface RealtimeError {
    code: ErrorCode;
    message: string;
}
export type Result<T> = { ok: true; data: T } | { ok: false; error: RealtimeError };

export type Ack<T> = (result: Result<T>) => void;

export type SessionRef = { sessionId: string } | string;

export interface Position {
    lineNumber: number;
    column: number;
}
export interface Selection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}
export interface PresenceUpdate {
    sessionId: string;
    cursor: Position | null;
    selection?: Selection | null;
}
export interface Message {
    id: string;
    sessionId: string;
    senderId: string;
    participantId: string;
    displayName: string;
    isGuest: boolean;
    content: string;
    timestamp: string;
}
export interface ClientEvents {
    "session:join": (payload: SessionRef, ack?: Ack<Joined>) => void;
    "session:leave": (payload: SessionRef, ack?: Ack<{ sessionId: string }>) => void;
    "session:message": (
        payload: { sessionId: string; content: string },
        ack?: Ack<Message>,
    ) => void;
    "document:update": (
        payload: { sessionId: string; update: Uint8Array },
        ack?: Ack<{ revision: number }>,
    ) => void;
    "presence:update": (payload: PresenceUpdate, ack?: Ack<{ sessionId: string }>) => void;
}
export interface ServerEvents {
    "session:joined": (payload: Joined) => void;
    "session:participant-joined": (payload: Presence & { sessionId: string }) => void;
    "session:participant-left": (payload: {
        sessionId: string;
        socketId: string;
        participantId: string;
        userId: string | null;
    }) => void;
    "session:message": (payload: Message) => void;
    "session:error": (error: RealtimeError) => void;
    "document:update": (payload: {
        sessionId: string;
        update: Uint8Array;
        revision: number;
        participantId: string;
    }) => void;
    "presence:update": (
        payload: PresenceUpdate & { socketId: string; participantId: string },
    ) => void;
}
export interface SocketData {
    identity: Identity;
    membership?: SessionAccess;
    authorizedAt?: number;
}
export type RealtimeServer = Server<ClientEvents, ServerEvents, Record<string, never>, SocketData>;
export type RealtimeSocket = Socket<ClientEvents, ServerEvents, Record<string, never>, SocketData>;
