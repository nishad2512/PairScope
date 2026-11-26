import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function migrate(): Promise<void> {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const db = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    try {
        const sql = await readFile("migrations/001_email_deliveries.sql", "utf8");
        await db.query(sql);
        console.info("Email delivery schema ready");
    } finally {
        await db.end();
    }
}

void migrate().catch(() => {
    console.error("Email delivery migration failed");
    process.exitCode = 1;
});
