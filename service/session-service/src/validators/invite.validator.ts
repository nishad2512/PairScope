import { z } from "zod";

export const createInviteSchema = z.object({
    email: z.email().nullable().optional(),
    role: z.enum(["INTERVIEWER", "CANDIDATE", "COLLABORATOR", "OBSERVER"]),
});

export const joinInviteSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "The name should be atleast 3 letters")
        .max(20, "The name should be within 20 letters"),
});

export type CreateInviteDTO = z.infer<typeof createInviteSchema>;
export type JoinInviteDTO = z.infer<typeof joinInviteSchema>;
