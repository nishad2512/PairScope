import { ISession } from "@/models/session.model";

export interface ISessionRepository {
    createSession(session: ISession): Promise<ISession>;
}