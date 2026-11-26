import { db } from "@/config/db";
import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession, sessions } from "@/models/session.model";
import { participants } from "@/models/participant.model";
import { DatabaseExecutor } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { desc, eq, inArray, or } from "drizzle-orm";

export class SessionRepository implements ISessionRepository {
    constructor(private readonly database: DatabaseExecutor = db) {}

    async getSessionById(sessionId: string): Promise<ISession | null> {
        const [session] = await this.database
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId));
        return session || null;
    }

    async getSessionForUpdate(
        sessionId: string,
    ): Promise<ISession | null> {
        const [session] = await this.database
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .for("update");
        return session || null;
    }

    async createSession(
        session: ISession,
    ): Promise<ISession> {
        const [newSession] = await this.database
            .insert(sessions)
            .values(session)
            .returning();

        if (!newSession) {
            throw new AppError(
                StatusCode.InternalServerError,
                "Session insert returned no record",
            );
        }
        return newSession;
    }

    async getSessionsForUser(userId: string): Promise<ISession[]> {
        return this.database
            .select()
            .from(sessions)
            .where(
                or(
                    eq(sessions.creatorId, userId),
                    inArray(
                        sessions.id,
                        this.database
                            .select({ sessionId: participants.sessionId })
                            .from(participants)
                            .where(eq(participants.userId, userId)),
                    ),
                ),
            )
            .orderBy(desc(sessions.createdAt));
    }
}
