import { InvitationEmail } from "@/interfaces/email.interface";

export function toInvitationEmail(email: InvitationEmail, frontendUrl: string) {
    return {
        eventId: email.invitationId,
        type: "organization.invitation.created.v1",
        occurredAt: new Date().toISOString(),
        data: {
            invitationId: email.invitationId,
            organizationId: email.organizationId,
            recipientEmail: email.recipientEmail,
            inviterName: email.inviterName,
            organizationName: email.organizationName,
            invitationUrl: new URL(
                `/organizations/join/${email.token}`,
                frontendUrl,
            ).href,
            expiresAt: email.expiresAt.toISOString(),
        },
    };
}
