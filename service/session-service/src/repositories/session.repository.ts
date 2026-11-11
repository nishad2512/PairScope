import { db } from "@/config/db";
import { ISessionRepository } from "@/interfaces/session.interface";
import { ISession, sessions } from "@/models/session.model";

export class SessionRepository implements ISessionRepository {
    async createSession(session: ISession): Promise<ISession> {
        const [newSession] = await db
            .insert(sessions)
            .values(session)
            .returning();

        if (!newSession) {
            throw new Error("Database crashed");
        }
        return newSession;
    }
}
