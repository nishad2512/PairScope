import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export interface ISession {
    id?: string;
    title: string;
    description: string | null;
    creatorId: string;
    orgId: string | null;
    sessionType: "INTERVIEW" | "COLLABORATION";
    language: string;
    questionId: string | null;
    status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
    scheduledAt?: Date | null;
    startedAt?: Date | null;
    endedAt?: Date | null;
    endedBy?: string | null;
    endReason?:
        | "OWNER_ENDED"
        | "INTERVIEWER_ENDED"
        | "ADMIN_ENDED"
        | "AUTO_TIMEOUT"
        | null;
    expiresAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const typeEnum = pgEnum("session_type", ["INTERVIEW", "COLLABORATION"]);
export const statusEnum = pgEnum("session_status", [
    "SCHEDULED",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
    "EXPIRED",
]);
export const endEnum = pgEnum("end_reason", [
    "OWNER_ENDED",
    "INTERVIEWER_ENDED",
    "ADMIN_ENDED",
    "AUTO_TIMEOUT",
]);

export const sessions = pgTable("session", {
    id: uuid().primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    creatorId: uuid().notNull(),
    orgId: uuid(),
    sessionType: typeEnum().notNull(),
    language: text("language").notNull(),
    questionId: uuid(),
    status: statusEnum().notNull(),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    endedBy: uuid(),
    endReason: endEnum(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});

// we need 3 tables in here
// sessions, participants, invitations
