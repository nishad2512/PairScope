import { z } from "zod";

export const createSessionSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(3, "Title must contain at least 3 characters")
            .max(100),

        description: z.string().trim().max(1000).nullable().optional(),

        orgId: z.uuid().nullable().optional(),

        sessionType: z.enum(["INTERVIEW", "COLLABORATION"]),

        language: z.string().trim().min(1).max(50),

        questionId: z.uuid().nullable().optional(),

        scheduledAt: z.coerce.date().nullable().optional(),
    })
    .strict();

export type CreateSessionDTO = z.infer<typeof createSessionSchema>;