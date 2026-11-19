import z from "zod";

export const createOrgSchema = z.object({
    name: z.string().min(3).max(20),
    slug: z.string().min(3).max(20),
    password: z.string().min(8).max(64),
});

export const createMemberSchema = z.object({
    userId: z.uuid(),
    role: z.enum(["INTERVIEWER", "ADMIN"]),
});

export type CreateOrgDTO = z.infer<typeof createOrgSchema>;

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;
