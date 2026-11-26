import { IRefresh } from "@/models/refresh.model";

export interface IRefreshRepository {
    create(
        refreshToken: Pick<
            IRefresh,
            "userId" | "currentTokenId" | "currentTokenHash" | "expiresAt"
        >,
    ): Promise<void>;
    findByTokenId(currentTokenId: string): Promise<IRefresh | null>;
    revokeByTokenId(currentTokenId: string): Promise<void>;
    updateById(id: string, data: Partial<Omit<IRefresh, "id">>): Promise<void>;
    findByPreviousTokenId(previousTokenId: string): Promise<IRefresh | null>;
    revokeById(id: string): Promise<void>;
}

export interface AccessPayload {
    userId: string;
    role?: string;
    iat?: number;
    exp?: number;
}

export interface RefreshPayload extends AccessPayload {
    currentTokenId: string;
}

export interface IGuestTokenService {
    generateGuestToken(partId: string, sessionId: string, role: string): string;
}

export interface ITokenService extends IGuestTokenService {
    generateAccessToken(userId: string, role: string): string;
    generateRefreshToken(userId: string, tokenId: string): Promise<string>;
    verifyAccessToken(token: string): AccessPayload;
    verifyRefreshToken(token: string): Promise<RefreshPayload>;
    revokeRefreshToken(token: string): Promise<void>;
    rotateRefreshToken(
        currentTokenId: string,
        newTokenId: string,
    ): Promise<string>;
}
