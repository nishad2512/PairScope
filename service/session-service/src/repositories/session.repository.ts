import { db } from "@/config/db";
import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession, sessions } from "@/models/session.model";
import { participants } from "@/models/participant.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { desc, eq, inArray, or } from "drizzle-orm";

export class SessionRepository implements ISessionRepository {
    async createSession(tx: Transaction, session: typeof sessions.$inferInsert): Promise<ISession> {
        const [newSession] = await tx
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
        return db
            .select()
            .from(sessions)
            .where(
                or(
                    eq(sessions.creatorId, userId),
                    inArray(
                        sessions.id,
                        db
                            .select({ sessionId: participants.sessionId })
                            .from(participants)
                            .where(eq(participants.userId, userId)),
                    ),
                ),
            )
            .orderBy(desc(sessions.createdAt));
    }
}
