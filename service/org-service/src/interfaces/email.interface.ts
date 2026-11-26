export interface InvitationEmail {
    invitationId: string;
    organizationId: string;
    recipientEmail: string;
    inviterName: string;
    organizationName: string;
    token: string;
    expiresAt: Date;
}
export interface IEmailPublisher {
    publishInvitation(email: InvitationEmail): Promise<void>;
}
