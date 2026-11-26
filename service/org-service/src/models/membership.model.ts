import { pgTable, pgEnum, uuid, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("member_role", [
    "OWNER",
    "INTERVIEWER",
    "ADMIN",
]);

export const members = pgTable("organization_membership", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().notNull(),
    orgId: uuid().notNull(),
    role: roleEnum().notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => [uniqueIndex("organization_membership_org_user_unique").on(table.orgId, table.userId)]);
