import z from "zod";

const envelope = {
    eventId: z.uuid(),
    occurredAt: z.iso.datetime(),
};
const invitation = {
    invitationId: z.uuid(),
    recipientEmail: z.email(),
    inviterName: z.string().min(1).max(200),
    invitationUrl: z.url(),
    expiresAt: z.iso.datetime(),
};

export const emailEventSchema = z.discriminatedUnion("type", [
    z.object({
        ...envelope,
        type: z.literal("session.invitation.created.v1"),
        data: z.object({ ...invitation, sessionId: z.uuid(), sessionTitle: z.string().min(1).max(200) }),
    }),
    z.object({
        ...envelope,
        type: z.literal("organization.invitation.created.v1"),
        data: z.object({ ...invitation, organizationId: z.uuid(), organizationName: z.string().min(1).max(200) }),
    }),
    z.object({
        ...envelope,
        type: z.literal("email.requested.v1"),
        data: z.object({
            recipientEmail: z.email(),
            subject: z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value)),
            text: z.string().min(1).max(30000),
            expiresAt: z.iso.datetime(),
        }),
    }),
]);

export type EmailEvent = z.infer<typeof emailEventSchema>;
