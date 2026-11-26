export interface InvitationEmail {
    invitationId: string;
    sessionId: string;
    recipientEmail: string;
    inviterName: string;
    sessionTitle: string;
    token: string;
    expiresAt: Date;
}

export interface IEmailPublisher {
    publishInvitation(email: InvitationEmail): Promise<void>;
}
