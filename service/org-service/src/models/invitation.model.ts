import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { roleEnum } from "./membership.model";

export const invitations = pgTable("organization_invitations", {
    id: uuid().primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    invitedBy: uuid("invited_by").notNull(),
    invitedUserId: uuid("invited_user_id").notNull(),
    invitedEmail: text("invited_email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    role: roleEnum().notNull(),
    status: text("status")
        .$type<"PENDING" | "ACCEPTED" | "REVOKED">()
        .notNull()
        .default("PENDING"),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
