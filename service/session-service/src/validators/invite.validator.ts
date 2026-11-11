import { z } from "zod";

export const createInviteSchema = z.object({
    email: z.email().nullable().optional(),
    role: z.enum(["INTERVIEWER", "CANDIDATE", "COLLABORATOR", "OBSERVER"]),
});

export type CreateInviteDTO = z.infer<typeof createInviteSchema>;
