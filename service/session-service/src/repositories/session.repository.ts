import { db } from "@/config/db";
import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession, sessions } from "@/models/session.model";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

export class SessionRepository implements ISessionRepository {
    async createSession(session: ISession): Promise<ISession> {
        const [newSession] = await db
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
