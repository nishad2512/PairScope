import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orgs = pgTable("organizations", {
    id: uuid().primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    tier: text("tier").default("free"),
    tierId: uuid(),
    ownerId: uuid().notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});
