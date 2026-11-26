import z from "zod";

export const createOrgSchema = z.object({
    name: z.string().min(3).max(20),
    slug: z.string().min(3).max(20),
});

export type CreateOrgDTO = z.infer<typeof createOrgSchema>;
