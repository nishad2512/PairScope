import { InvitationEmail } from "@/interfaces/email.interface";

export function toInvitationEmail(email: InvitationEmail, frontendUrl: string) {
    return {
        eventId: email.invitationId,
        type: "session.invitation.created.v1",
        occurredAt: new Date().toISOString(),
        data: {
            invitationId: email.invitationId,
            sessionId: email.sessionId,
            recipientEmail: email.recipientEmail,
            inviterName: email.inviterName,
            sessionTitle: email.sessionTitle,
            invitationUrl: new URL(`/join/${email.token}`, frontendUrl).href,
            expiresAt: email.expiresAt.toISOString(),
        },
    };
}
