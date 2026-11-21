export interface CursorPosition {
    lineNumber: number;
    column: number;
}

export interface CursorSelection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

export interface SessionParticipant {
    id: string;
    userId: string | null;
    displayName: string;
    role: string;
}

export interface PresenceParticipant extends SessionParticipant {
    socketId: string;
    isGuest: boolean;
}

export interface CursorUpdate {
    sessionId: string;
    cursor: CursorPosition | null;
    selection?: CursorSelection | null;
}

export interface RemoteCursor extends CursorUpdate {
    socketId: string;
    participantId: string;
}

export interface JoinedSession {
    sessionId: string;
    language: string;
    status: string;
    participant: SessionParticipant;
    participants: PresenceParticipant[];
}

export interface RealtimeError {
    code: string;
    message: string;
}

export type ConnectionStatus =
    "connecting" | "joining" | "connected" | "reconnecting" | "disconnected" | "error";
export type Result<T> = { ok: true; data: T } | { ok: false; error: RealtimeError };

export interface ServerEvents {
    "session:participant-joined": (
        participant: PresenceParticipant & { sessionId: string },
    ) => void;
    "session:participant-left": (participant: { sessionId: string; socketId: string }) => void;
    "presence:update": (cursor: RemoteCursor) => void;
    "session:error": (error: RealtimeError) => void;
}

export interface ClientEvents {
    "session:join": (
        payload: { sessionId: string },
        ack: (result: Result<JoinedSession>) => void,
    ) => void;
    "session:leave": (payload: { sessionId: string }) => void;
    "presence:update": (payload: CursorUpdate) => void;
}
