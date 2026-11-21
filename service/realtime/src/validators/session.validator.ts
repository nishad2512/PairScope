import z from "zod";

export const sessionSchema = z.union([
    z.uuid().transform((sessionId) => ({ sessionId })),
    z.object({ sessionId: z.uuid() }).strict(),
]);

export const messageSchema = z
    .object({
        sessionId: z.uuid(),
        content: z.string().trim().min(1).max(4000),
    })
    .strict();

const positionSchema = z.number().int().positive().max(1_000_000);

export const presenceSchema = z
    .object({
        sessionId: z.uuid(),
        cursor: z
            .object({
                lineNumber: positionSchema,
                column: positionSchema,
            })
            .strict()
            .nullable(),
        selection: z
            .object({
                startLineNumber: positionSchema,
                startColumn: positionSchema,
                endLineNumber: positionSchema,
                endColumn: positionSchema,
            })
            .strict()
            .nullable()
            .optional(),
    })
    .strict();

export const documentSchema = z
    .object({
        sessionId: z.uuid(),
        update: z
            .instanceof(Uint8Array)
            .refine(
                (update) =>
                    update.byteLength > 0 && update.byteLength <= 64 * 1024,
            ),
    })
    .strict();

export const sessionAccessSchema = z.object({
    sessionId: z.uuid(),
    language: z.string().min(1),
    status: z.enum(["live", "scheduled"]),
    expiresAt: z.iso.datetime().nullable(),
    participant: z.object({
        id: z.uuid(),
        userId: z.uuid().nullable(),
        displayName: z.string(),
        role: z.enum([
            "OWNER",
            "INTERVIEWER",
            "CANDIDATE",
            "COLLABORATOR",
            "OBSERVER",
        ]),
    }),
});

export const sessionResponseSchema = z.object({ data: sessionAccessSchema });

export type SessionDTO = z.infer<typeof sessionSchema>;
export type MessageDTO = z.infer<typeof messageSchema>;
export type PresenceDTO = z.infer<typeof presenceSchema>;
export type DocumentDTO = z.infer<typeof documentSchema>;
