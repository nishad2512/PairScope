import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { roleEnum } from "./participant.model";

export interface ISessionInvitations {
    id?: string;
    sessionId: string;
    invitedBy: string;
    invitedEmail?: string | null;
    invitedUserId?: string | null;
    tokenHash: string;
    role: "INTERVIEWER" | "CANDIDATE" | "COLLABORATOR" | "OBSERVER" | "OWNER";
    status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
    expiresAt?: Date;
    acceptedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const statusEnum = pgEnum("invitation_status", [
    "PENDING",
    "ACCEPTED",
    "REVOKED",
    "EXPIRED",
]);

export const invitations = pgTable("session_invitations", {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid().notNull(),
    invitedBy: uuid().notNull(),
    invitedEmail: text("invited_email"),
    invitedUserId: uuid(),
    tokenHash: text("token_hash").notNull().unique(),
    role: roleEnum().notNull(),
    status: statusEnum().default("PENDING").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("acceted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});
