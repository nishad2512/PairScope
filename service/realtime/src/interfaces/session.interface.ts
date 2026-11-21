export type ParticipantRole =
    "OWNER" | "INTERVIEWER" | "CANDIDATE" | "COLLABORATOR" | "OBSERVER";

export interface IIdentity {
    userId: string;
    sessionId?: string;
    expiresAt: number;
}

export interface IParticipant {
    id: string;
    userId: string | null;
    displayName: string;
    role: ParticipantRole;
}

export interface ISessionAccess {
    sessionId: string;
    language: string;
    status: "live" | "scheduled";
    expiresAt: string | null;
    participant: IParticipant;
}

export interface IPresence extends IParticipant {
    socketId: string;
    isGuest: boolean;
}

export interface IDocumentState {
    update: Uint8Array;
    revision: number;
}

export interface IJoinedSession extends ISessionAccess {
    participants: IPresence[];
    document: IDocumentState;
}

export interface IPosition {
    lineNumber: number;
    column: number;
}

export interface ISelection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

export interface IPresenceUpdate {
    sessionId: string;
    cursor: IPosition | null;
    selection?: ISelection | null;
}

export interface IMessage {
    id: string;
    sessionId: string;
    senderId: string;
    participantId: string;
    displayName: string;
    isGuest: boolean;
    content: string;
    timestamp: string;
}

export interface ISessionService {
    authorize(sessionId: string, identity: IIdentity): Promise<ISessionAccess>;
}
