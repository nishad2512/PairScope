import { DocumentStore } from "../interfaces/realtime.interface";
import type Redis from "ioredis";
import * as Y from "yjs";
import { SocketError } from "../utils/errors";
import type { DocumentState } from "../types/events";

const DOCUMENT_TTL = 24 * 60 * 60;
const MAX_DOCUMENT_BYTES = 512 * 1024;
// Save only if the revision is unchanged; retry when another worker edited first.
const writeDocument = `
local revision = tonumber(redis.call('HGET', KEYS[1], 'revision') or '0')
if revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('HSET', KEYS[1], 'revision', revision + 1, 'update', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return revision + 1`;
export class RedisDocumentStore implements DocumentStore {
    constructor(private readonly redis: Redis) {}

    async document(sessionId: string): Promise<DocumentState> {
        const [revision, update] = await this.redis.hmget(
            `rt:document:${sessionId}`,
            "revision",
            "update",
        );
        return {
            revision: Number(revision || 0),
            update: update ? Buffer.from(update, "base64") : Buffer.from([0, 0]),
        };
    }

    async apply(sessionId: string, update: Uint8Array): Promise<number> {
        for (let attempt = 0; attempt < 16; attempt++) {
            const current = await this.document(sessionId);
            const doc = new Y.Doc();
            let merged: Uint8Array;
            try {
                Y.applyUpdate(doc, current.update);
                try {
                    Y.applyUpdate(doc, update);
                } catch {
                    throw new SocketError("INVALID_PAYLOAD", "The document update is invalid.");
                }
                merged = Y.encodeStateAsUpdate(doc);
            } finally {
                doc.destroy();
            }
            if (merged.byteLength > MAX_DOCUMENT_BYTES) {
                throw new SocketError(
                    "DOCUMENT_TOO_LARGE",
                    "The shared document exceeds the 512 KiB limit.",
                );
            }
            const revision = Number(
                await this.redis.eval(
                    writeDocument,
                    1,
                    `rt:document:${sessionId}`,
                    current.revision,
                    Buffer.from(merged).toString("base64"),
                    DOCUMENT_TTL,
                ),
            );
            if (revision) {
                return revision;
            }
        }
        throw new SocketError(
            "SERVICE_UNAVAILABLE",
            "The document is busy. Please retry the update.",
        );
    }
}
