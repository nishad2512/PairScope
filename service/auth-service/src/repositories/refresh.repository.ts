import { db } from "@/config/db";
import { IRefreshRepository } from "@/interfaces/refresh.interface";
import { IRefresh, refresh } from "@/models/refresh.model";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "tsyringe";

@injectable()
export class RefreshRepository implements IRefreshRepository {
    async create(refreshToken: any): Promise<void> {
        await db.insert(refresh).values(refreshToken);
    }

    async findByPreviousTokenId(
        previousTokenId: string,
    ): Promise<IRefresh | null> {
        const [token] = await db
            .select()
            .from(refresh)
            .where(
                and(
                    eq(refresh.previousTokenId, previousTokenId),
                    isNull(refresh.revokedAt),
                ),
            );

        if (!token) {
            throw new Error("Token not found");
        }

        return token;
    }

    async findByTokenId(currentTokenId: string): Promise<IRefresh | null> {
        const [token] = await db
            .select()
            .from(refresh)
            .where(
                and(
                    eq(refresh.currentTokenId, currentTokenId),
                    isNull(refresh.revokedAt),
                ),
            );

        if (!token) {
            throw new Error("Token not found");
        }

        return token;
    }

    async updateById(id: string, data: any): Promise<void> {
        await db.update(refresh).set(data).where(eq(refresh.id, id));
    }

    async revokeByTokenId(currentTokenId: string): Promise<void> {
        await db
            .update(refresh)
            .set({ revokedAt: new Date() })
            .where(eq(refresh.currentTokenId, currentTokenId));
    }

    async revokeById(id: string): Promise<void> {
        await db
            .update(refresh)
            .set({ revokedAt: new Date() })
            .where(eq(refresh.id, id));
    }
}
