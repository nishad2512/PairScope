import { Pool } from "pg";
import { DeliveryRepository } from "../interfaces/email.interface";
import { EmailEvent } from "../validator/email.validator";
import { EmailError } from "../utils/email-error";

export class PostgresDeliveryRepository implements DeliveryRepository {
    constructor(private readonly db: Pool, private readonly leaseMs: number) {}

    async claim(event: EmailEvent, leaseId: string): Promise<"claimed" | "completed" | "busy"> {
        const result = await this.db.query(`
            INSERT INTO email_deliveries (event_id, recipient, event_type, lease_id, lease_until)
            VALUES ($1, $2, $3, $4, now() + $5 * interval '1 millisecond')
            ON CONFLICT (event_id) DO UPDATE
            SET status = 'processing', lease_id = $4,
                lease_until = now() + $5 * interval '1 millisecond', updated_at = now()
            WHERE email_deliveries.status = 'pending'
                OR (email_deliveries.status = 'processing' AND email_deliveries.lease_until <= now())
            RETURNING event_id`,
            [event.eventId, event.data.recipientEmail, event.type, leaseId, this.leaseMs]);
        if (result.rowCount) return "claimed";
        const current = await this.db.query<{ status: string; recipient: string; event_type: string }>(
            "SELECT status, recipient, event_type FROM email_deliveries WHERE event_id = $1", [event.eventId],
        );
        const delivery = current.rows[0];
        if (delivery && (delivery.recipient !== event.data.recipientEmail || delivery.event_type !== event.type)) {
            throw new EmailError("EVENT_ID_CONFLICT");
        }
        return delivery?.status === "sent" || delivery?.status === "skipped" ? "completed" : "busy";
    }

    async complete(eventId: string, leaseId: string, status: "sent" | "skipped"): Promise<void> {
        const result = await this.db.query(
            "UPDATE email_deliveries SET status = $3, lease_until = NULL, updated_at = now() WHERE event_id = $1 AND lease_id = $2",
            [eventId, leaseId, status],
        );
        if (!result.rowCount) throw new EmailError("DELIVERY_LEASE_LOST", true);
    }

    async release(eventId: string, leaseId: string): Promise<void> {
        await this.db.query(
            "UPDATE email_deliveries SET status = 'pending', lease_until = NULL, updated_at = now() WHERE event_id = $1 AND lease_id = $2 AND status = 'processing'",
            [eventId, leaseId],
        );
    }
}
