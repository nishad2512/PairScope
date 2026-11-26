import z from "zod";

export const emailConfigSchema = z.object({
    RABBITMQ_URL: z.url().refine((value) => /^amqps?:/.test(value)),
    FRONTEND_URL: z.url().refine((value) => /^https?:/.test(value)),
});
