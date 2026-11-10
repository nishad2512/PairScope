import { pgTable } from "drizzle-orm/pg-core";

export const sessions = pgTable("session", {
})


// we need 3 tables in here
// sessions, participants, invitations