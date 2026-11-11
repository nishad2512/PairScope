import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession, sessions } from "@/models/session.model";
import { Transaction } from "@/types/database.types";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

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
}
