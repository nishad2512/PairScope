import { pgTable, uuid, text, pgEnum, timestamp } from "drizzle-orm/pg-core";

export interface ISessionParticipant {
    id?: string;
    sessionId: string;
    userId: string | null;
    displayName: string;
    role: "INTERVIEWER" | "CANDIDATE" | "COLLABORATOR" | "OBSERVER" | "OWNER";
    invitationId?: string | null;
    joinedAt?: Date | null;
    leftAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const roleEnum = pgEnum("participant_role", [
    "INTERVIEWER",
    "CANDIDATE",
    "COLLABORATOR",
    "OBSERVER",
    "OWNER",
]);
// export const typeEnum = pgEnum("participant_type", ["REGISTERED", "GUEST"]);

export const participants = pgTable("session_participants", {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid().notNull(),
    userId: uuid(),
    displayName: text("display_name").notNull(),
    role: roleEnum().notNull(),
    invitationId: uuid(),
    joinedAt: timestamp("joined_at"),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});

// leftAt can be set as null when the user rejoins, or we can use status enum
// but what happens to joinedAt at that time
// user can be checked whether he is registered by checking userId !== null
