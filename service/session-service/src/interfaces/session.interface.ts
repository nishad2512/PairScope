import { ISession, sessions } from "@/models/session.model";
import { Transaction } from "@/types/database.types";

export interface ISessionRepository {
    getSessionById(sessionId: string): Promise<ISession | null>;
    getSessionForUpdate(
        tx: Transaction,
        sessionId: string,
    ): Promise<ISession | null>;
    getSessionsForUser(userId: string): Promise<ISession[]>;
    createSession(
        tx: Transaction,
        session: typeof sessions.$inferInsert,
    ): Promise<ISession>;
}

export interface AccessPayload {
    userId: string;
    role?: string | null;
    sessionId?: string;
}

export interface IAuthUser {
    id: string;
    displayName: string;
    email: string;
}
