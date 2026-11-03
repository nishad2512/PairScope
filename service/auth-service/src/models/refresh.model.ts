import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.model";

export interface IRefresh {
    id?: string;
    userId: string;
    currentTokenId: string;
    currentTokenHash: string;
    previousTokenId: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export const refresh = pgTable("refresh", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    currentTokenId: text("current_token_id").notNull(),
    currentTokenHash: text("current_token_hash").notNull(),
    previousTokenId: text("previous_token_id"),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});
