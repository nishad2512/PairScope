import { ISession, sessions } from "@/models/session.model";
import { Transaction } from "@/types/database.types";

export interface ISessionRepository {
    createSession(
        tx: Transaction,
        session: typeof sessions.$inferInsert,
    ): Promise<ISession>;
}
