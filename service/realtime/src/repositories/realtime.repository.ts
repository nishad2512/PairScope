import { injectable } from "tsyringe";
import { pubClient } from "@/config/redis";
import { IRealtimeRepository } from "@/interfaces/realtime.interface";
import { IDocumentState, IIdentity } from "@/interfaces/session.interface";

const DOCUMENT_TTL = 24 * 60 * 60;
const LEASE_MS = 45_000;

const writeDocument = `
local revision = tonumber(redis.call('HGET', KEYS[1], 'revision') or '0')
if revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('HSET', KEYS[1], 'revision', revision + 1, 'update', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return revision + 1`;
const reserveConnection = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
if not redis.call('ZSCORE', KEYS[1], ARGV[2]) and redis.call('ZCARD', KEYS[1]) >= 5 then return 0 end
redis.call('ZADD', KEYS[1], ARGV[3], ARGV[2])
redis.call('PEXPIRE', KEYS[1], ARGV[4])
return 1`;

@injectable()
export class RealtimeRepository implements IRealtimeRepository {
    async getDocument(sessionId: string): Promise<IDocumentState> {
        const [revision, update] = await pubClient.hmget(
            `rt:document:${sessionId}`,
            "revision",
            "update",
        );

        return {
            revision: Number(revision || 0),
            update: update
                ? Buffer.from(update, "base64")
                : Buffer.from([0, 0]),
        };
    }

    async saveDocument(
        sessionId: string,
        document: IDocumentState,
    ): Promise<number> {
        const revision = await pubClient.eval(
            writeDocument,
            1,
            `rt:document:${sessionId}`,
            document.revision,
            Buffer.from(document.update).toString("base64"),
            DOCUMENT_TTL,
        );

        return Number(revision);
    }

    async reserveConnection(
        identity: IIdentity,
        socketId: string,
    ): Promise<boolean> {
        const now = Date.now();
        const key = `rt:connections:${identity.sessionId ? "guest" : "user"}:${identity.userId}`;
        const reserved = await pubClient.eval(
            reserveConnection,
            1,
            key,
            now,
            socketId,
            now + LEASE_MS,
            LEASE_MS,
        );

        return reserved === 1;
    }

    async releaseConnection(
        identity: IIdentity,
        socketId: string,
    ): Promise<void> {
        const key = `rt:connections:${identity.sessionId ? "guest" : "user"}:${identity.userId}`;

        await pubClient.zrem(key, socketId);
    }
}
