import { ISessionRepository } from "./session.interface";
import { IParticipantRepository } from "./participant.interface";
import { IInvitationRepository } from "./invitation.interface";

export interface SessionRepositories {
    sessions: ISessionRepository;
    participants: IParticipantRepository;
    invitations: IInvitationRepository;
}

export interface ISessionTransaction {
    run<T>(action: (repositories: SessionRepositories) => Promise<T>): Promise<T>;
}
