import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

async function migrate(): Promise<void> {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        await client.query("BEGIN");
        await client.query(await readFile("migrations/001_membership_invitations.sql", "utf8"));
        await client.query("COMMIT");
        console.info("Organization invitations migration completed");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        await client.end();
    }
}
void migrate().catch(() => {
    console.error("Migration failed. Check the database schema and duplicate memberships.");
    process.exitCode = 1;
});
