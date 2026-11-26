import z from "zod";

export const userLookupSchema = z.object({ email: z.email() });
export const userProfilesSchema = z.object({
    userIds: z.array(z.uuid()).max(200),
});
export const guestTokenSchema = z.object({
    partId: z.uuid(),
    sessionId: z.uuid(),
    role: z.enum([
        "OWNER",
        "INTERVIEWER",
        "CANDIDATE",
        "COLLABORATOR",
        "OBSERVER",
    ]),
});
