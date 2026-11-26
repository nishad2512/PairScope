import nodemailer, { Transporter } from "nodemailer";
import { Email, EmailProvider } from "../interfaces/email.interface";
import { EmailError } from "../utils/email-error";

interface SmtpOptions {
    host: string;
    port: number;
    secure: boolean;
    requireTLS: boolean;
    user?: string;
    password?: string;
    from: string;
}

export class SmtpProvider implements EmailProvider {
    private readonly transport: Transporter;

    constructor(private readonly options: SmtpOptions) {
        this.transport = nodemailer.createTransport({
            host: options.host,
            port: options.port,
            secure: options.secure,
            requireTLS: options.requireTLS,
            auth: options.user ? { user: options.user, pass: options.password } : undefined,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 30000,
            disableFileAccess: true,
            disableUrlAccess: true,
        });
    }

    async send(email: Email): Promise<void> {
        try {
            const result = await this.transport.sendMail({ ...email, from: this.options.from });
            if (!result.accepted?.length) {
                throw new EmailError("RECIPIENT_REJECTED");
            }
        } catch (error) {
            if (error instanceof EmailError) throw error;
            const failure = error as { code?: string; responseCode?: number };
            if (failure.code === "EAUTH" || failure.responseCode === 535) {
                throw new EmailError("SMTP_AUTH_FAILED", true);
            }
            if (failure.responseCode && failure.responseCode >= 500) {
                throw new EmailError("SMTP_PERMANENT_FAILURE");
            }
            throw new EmailError("SMTP_TEMPORARY_FAILURE", true);
        }
    }

    close(): void {
        this.transport.close();
    }
}
