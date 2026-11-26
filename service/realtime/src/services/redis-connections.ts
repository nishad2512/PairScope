import type Redis from "ioredis";
import { ConnectionLease } from "../interfaces/realtime.interface";
import { Identity } from "../types/events";
import { SocketError } from "../utils/errors";

const LEASE_MS = 45_000;
const reserveConnection = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
if not redis.call('ZSCORE', KEYS[1], ARGV[2]) and redis.call('ZCARD', KEYS[1]) >= 5 then return 0 end
redis.call('ZADD', KEYS[1], ARGV[3], ARGV[2])
redis.call('PEXPIRE', KEYS[1], ARGV[4])
return 1`;

export class RedisConnectionLease implements ConnectionLease {
    constructor(private readonly redis: Redis) {}

    private connectionKey(identity: Identity) {
        return `rt:connections:${identity.sessionId ? "guest" : "user"}:${identity.userId}`;
    }

    async reserve(identity: Identity, socketId: string): Promise<void> {
        const now = Date.now();
        const reserved = await this.redis.eval(
            reserveConnection,
            1,
            this.connectionKey(identity),
            now,
            socketId,
            now + LEASE_MS,
            LEASE_MS,
        );
        if (!reserved) {
            throw new SocketError(
                "RATE_LIMITED",
                "At most five realtime connections are allowed per identity.",
            );
        }
    }

    async release(identity: Identity, socketId: string): Promise<void> {
        await this.redis.zrem(this.connectionKey(identity), socketId);
    }
}
