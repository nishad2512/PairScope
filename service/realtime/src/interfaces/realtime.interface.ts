import { DocumentState, Identity, SessionAccess } from "../types/events";

export interface DocumentStore {
    document(sessionId: string): Promise<DocumentState>;
    apply(sessionId: string, update: Uint8Array): Promise<number>;
}

export interface ConnectionLease {
    reserve(identity: Identity, socketId: string): Promise<void>;
    release(identity: Identity, socketId: string): Promise<void>;
}

export type SessionAuthorizer = (
    sessionId: string,
    identity: Identity,
) => Promise<SessionAccess>;
