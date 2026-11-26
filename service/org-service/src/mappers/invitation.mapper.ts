import { OrgInvitation } from "@/interfaces/invitation.interface";

export function toInvitationResponse(invitation: OrgInvitation) {
    return {
        id: invitation.id,
        orgId: invitation.orgId,
        invitedBy: invitation.invitedBy,
        invitedEmail: invitation.invitedEmail,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt,
        createdAt: invitation.createdAt,
    };
}
