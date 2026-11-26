import z from "zod";

export const createInvitationSchema = z.object({
    email: z.email().trim().toLowerCase(),
    role: z.enum(["INTERVIEWER", "ADMIN"]),
});
export const orgIdSchema = z.uuid();
export const invitationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/i);
export const accessPayloadSchema = z.object({ userId: z.uuid(), sessionId: z.uuid().optional() });
export type CreateInvitationDTO = z.infer<typeof createInvitationSchema>;
