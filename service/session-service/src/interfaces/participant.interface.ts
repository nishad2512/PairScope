import type { ISessionParticipant } from "@/models/participant.model";

export interface IParticipantRepository {
    getUserParticipant(sessionId: string, userId: string): Promise<ISessionParticipant | null>;
    getGuestParticipant(sessionId: string, participantId: string): Promise<ISessionParticipant | null>;
    createParticipant(participant: ISessionParticipant): Promise<ISessionParticipant>;
}
