import { EmailProvider } from "../interfaces/email.interface";
import { EmailEvent } from "../validator/email.validator";
import { renderEmail } from "../templates/invitation";

export class EmailService {
    constructor(
        private readonly provider: EmailProvider,
        private readonly frontendOrigin: string,
    ) {}

    async deliver(event: EmailEvent): Promise<"sent" | "skipped"> {
        if (Date.parse(event.data.expiresAt) <= Date.now()) return "skipped";
        const email = renderEmail(event, this.frontendOrigin);
        await this.provider.send({ ...email, messageId: `<${event.eventId}@notifications.pairscope>` });
        return "sent";
    }
}
