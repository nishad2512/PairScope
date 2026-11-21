import z from "zod";

export const realtimeConfigSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3004),
    ACCESS_SECRET: z.string().min(1),
    INTERNAL_SERVICE_SECRET: z.string().min(16),
    REDIS_URL: z.url().default("redis://localhost:6379"),
    SESSION_SERVICE_URL: z.url().default("http://localhost:3002"),
    CLIENT_URL: z
        .string()
        .default("http://localhost:5173,http://127.0.0.1:5173")
        .transform((value) =>
            value.split(",").map((origin) => new URL(origin.trim()).origin),
        ),
});
