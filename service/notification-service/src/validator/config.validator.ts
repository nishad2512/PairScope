import z from "zod";

export const configSchema = z.object({
    RABBITMQ_URL: z.url().refine((value) => /^amqps?:/.test(value)),
    FRONTEND_URL: z.url().transform((value) => new URL(value).origin),
    EMAIL_FROM: z.email(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
    SMTP_REQUIRE_TLS: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_PREFETCH: z.coerce.number().int().min(1).max(50).default(5),
    EMAIL_RETRY_DELAYS_MS: z.string().default("10000,60000,300000")
        .transform((value) => value.split(",").map(Number))
        .pipe(z.array(z.number().int().min(1000).max(86400000)).min(1).max(5)),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
}).refine((value) => !!value.SMTP_USER === !!value.SMTP_PASSWORD, {
    message: "SMTP_USER and SMTP_PASSWORD must be provided together",
});
