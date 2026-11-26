import { ISessionParticipant } from "@/models/participant.model";

export function toParticipantResponse(participant: ISessionParticipant) {
    return {
        id: participant.id,
        sessionId: participant.sessionId,
        userId: participant.userId,
        displayName: participant.displayName,
        role: participant.role,
        invitationId: participant.invitationId,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt,
    };
}
