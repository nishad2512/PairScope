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

export interface DeliveryRepository {
    claim(event: EmailEvent, leaseId: string): Promise<"claimed" | "completed" | "busy">;
    complete(eventId: string, leaseId: string, status: "sent" | "skipped"): Promise<void>;
    release(eventId: string, leaseId: string): Promise<void>;
}
