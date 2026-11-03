import { IRefresh } from "@/models/refresh.model";

export interface IRefreshRepository {
    create(refreshToken: any): Promise<void>;
    findByTokenId(currentTokenId: string): Promise<IRefresh | null>;
    revokeByTokenId(currentTokenId: string): Promise<void>;
    updateById(id: string, data: any): Promise<void>;
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
    currentTokenId: string
}

export interface ITokenService {
    generateAccessToken(userId: string, role: string): string;
    generateRefreshToken(userId: string, tokenId: string): Promise<string>;
    verifyAccessToken(token: string): AccessPayload;
    verifyRefreshToken(token: string): Promise<RefreshPayload>;
    revokeRefreshToken(token: string): Promise<void>;
    rotateRefreshToken(currentTokenId: string, newTokenId: string): Promise<string>;
}