export interface Email {
    to: string;
    subject: string;
    text: string;
    messageId: string;
}

export interface EmailProvider {
    send(email: Email): Promise<void>;
}
