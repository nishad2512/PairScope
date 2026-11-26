import { db } from "@/config/db";
import { ISessionTransaction, SessionRepositories } from "@/interfaces/transaction.interface";
import { SessionRepository } from "./session.repository";
import { ParticipantRepository } from "./participant.repository";
import { InvitationRepository } from "./invitation.repository";

export class SessionTransaction implements ISessionTransaction {
    run<T>(action: (repositories: SessionRepositories) => Promise<T>): Promise<T> {
        return db.transaction((tx) => action({
            sessions: new SessionRepository(tx),
            participants: new ParticipantRepository(tx),
            invitations: new InvitationRepository(tx),
        }));
    }
}
