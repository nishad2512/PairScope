import { EmailEvent } from "../validator/email.validator";
import { Email } from "../interfaces/email.interface";
import { EmailError } from "../utils/email-error";

export function renderEmail(
    event: EmailEvent,
    frontendOrigin: string,
): Omit<Email, "messageId"> {
    if (event.type === "email.requested.v1") {
        return {
            to: event.data.recipientEmail,
            subject: event.data.subject,
            text: event.data.text,
        };
    }

    const url = new URL(event.data.invitationUrl);
    if (url.origin !== frontendOrigin || url.username || url.password) {
        throw new EmailError("INVALID_INVITATION_URL");
    }
    const name =
        event.type === "session.invitation.created.v1"
            ? event.data.sessionTitle
            : event.data.organizationName;
    const kind =
        event.type === "session.invitation.created.v1"
            ? "session"
            : "organization";
    return {
        to: event.data.recipientEmail,
        subject: `PairScope ${kind} invitation`,
        text: `${event.data.inviterName} invited you to ${name}.\n\nAccept the invitation: ${url.href}\n\nThis invitation expires at ${event.data.expiresAt}.\nIf you did not expect this invitation, you can ignore this email.`,
    };
}
