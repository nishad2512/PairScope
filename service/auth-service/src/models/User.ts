import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface IUser {
    id?: string,
    displayName: string,
    email: string,
    password: string,
    avatarUrl: string | null,
    role: "user" | "admin" | null,
    createdAt?: Date,
    updatedAt?: Date
}

export const roleEnum = pgEnum("user_role", ["user", "admin"])

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name").notNull(),
    role: roleEnum().default("user"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
});