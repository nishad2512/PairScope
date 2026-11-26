import { randomUUID } from "node:crypto";
import { DeliveryRepository, EmailProvider } from "../interfaces/email.interface";
import { EmailEvent } from "../validator/email.validator";
import { renderEmail } from "../templates/invitation";
import { EmailError } from "../utils/email-error";

export class EmailService {
    constructor(
        private readonly provider: EmailProvider,
        private readonly deliveries: DeliveryRepository,
        private readonly frontendOrigin: string,
    ) {}

    async deliver(event: EmailEvent): Promise<"sent" | "skipped" | "duplicate"> {
        const leaseId = randomUUID();
        const claim = await this.deliveries.claim(event, leaseId);
        if (claim === "completed") return "duplicate";
        if (claim === "busy") throw new EmailError("DELIVERY_BUSY", true);

        try {
            if (Date.parse(event.data.expiresAt) <= Date.now()) {
                await this.deliveries.complete(event.eventId, leaseId, "skipped");
                return "skipped";
            }
            const email = renderEmail(event, this.frontendOrigin);
            await this.provider.send({ ...email, messageId: `<${event.eventId}@notifications.pairscope>` });
            await this.deliveries.complete(event.eventId, leaseId, "sent");
            return "sent";
        } catch (error) {
            await this.deliveries.release(event.eventId, leaseId);
            throw error;
        }
    }
}
