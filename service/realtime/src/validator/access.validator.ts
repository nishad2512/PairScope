import z from "zod";

const accessSchema = z.object({
    sessionId: z.uuid(),
    language: z.string().min(1),
    status: z.enum(["live", "scheduled"]),
    expiresAt: z.iso.datetime().nullable(),
    participant: z.object({
        id: z.uuid(),
        userId: z.uuid().nullable(),
        displayName: z.string(),
        role: z.enum(["OWNER", "INTERVIEWER", "CANDIDATE", "COLLABORATOR", "OBSERVER"]),
    }),
});

export const accessResponseSchema = z.object({ data: accessSchema });
