import { Pool } from "pg";
import { config } from "./env";

export const db = new Pool({
    connectionString: config.DATABASE_URL,
    max: config.EMAIL_PREFETCH + 2,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
});

db.on("error", () => console.error(JSON.stringify({ action: "database.connection.failed" })));
