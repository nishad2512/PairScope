import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new AppError(
        StatusCode.InternalServerError,
        "DATABASE_URL must be configured for the session service",
    );
}

export const db = drizzle(databaseUrl);
