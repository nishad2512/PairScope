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
const position = z.number().int().positive().max(1_000_000);
export const presenceSchema = z
    .object({
        sessionId: z.uuid(),
        cursor: z.object({ lineNumber: position, column: position }).strict().nullable(),
        selection: z
            .object({
                startLineNumber: position,
                startColumn: position,
                endLineNumber: position,
                endColumn: position,
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
            .refine((value) => value.byteLength > 0 && value.byteLength <= 64 * 1024),
    })
    .strict();
