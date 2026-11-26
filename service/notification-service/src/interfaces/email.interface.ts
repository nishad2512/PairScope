import { EmailEvent } from "../validator/email.validator";

export interface Email {
    to: string;
    subject: string;
    text: string;
    messageId: string;
}

export interface EmailProvider {
    send(email: Email): Promise<void>;
}

export interface IEmailService {
    deliver(event: EmailEvent): Promise<"sent" | "skipped">;
}
