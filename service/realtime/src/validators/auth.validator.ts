import z from "zod";

export const accessTokenSchema = z.object({
    userId: z.uuid(),
    sessionId: z.uuid().optional(),
    exp: z.number().int().positive(),
});
