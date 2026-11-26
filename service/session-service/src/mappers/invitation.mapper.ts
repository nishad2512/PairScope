import { InvitationRecord } from "@/interfaces/invitation.interface";
import { ISessionParticipant } from "@/models/participant.model";
import { toParticipantResponse } from "./participant.mapper";

export function toInvitationResponse(invitation: InvitationRecord) {
    return {
        id: invitation.id,
        sessionId: invitation.sessionId,
        invitedBy: invitation.invitedBy,
        invitedEmail: invitation.invitedEmail,
        invitedUserId: invitation.invitedUserId,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
    };
}

export function toJoinedInvitationResponse(
    result: ISessionParticipant | { result: ISessionParticipant; data: { token: string } },
) {
    if ("result" in result) {
        return {
            result: toParticipantResponse(result.result),
            data: { token: result.data.token },
        };
    }
    return toParticipantResponse(result);
}
