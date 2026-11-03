import {
    AccessPayload,
    IRefreshRepository,
    ITokenService,
    RefreshPayload,
} from "@/interfaces/refresh.interface";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import AppError from "@/utils/AppError";
import { inject, injectable } from "tsyringe";

@injectable()
export class TokenService implements ITokenService {
    constructor(
        @inject("IRefreshRepository") private readonly repo: IRefreshRepository,
    ) {}

    public generateAccessToken(userId: string, role: string) {
        return jwt.sign({ userId, role }, process.env.ACCESS_SECRET!, {
            expiresIn: "15m",
        });
    }

    public async generateRefreshToken(userId: string, currentTokenId: string) {
        const token = jwt.sign(
            { userId, currentTokenId },
            process.env.REFRESH_SECRET!,
            {
                expiresIn: "30d",
            },
        );

        const currentTokenHash = await bcrypt.hash(token, 12);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.repo.create({
            userId,
            currentTokenId,
            currentTokenHash,
            expiresAt,
        });

        return token;
    }

    public async rotateRefreshToken(
        currentTokenId: string,
        newTokenId: string,
    ) {
        const tokenFamily = await this.repo.findByTokenId(currentTokenId);
        if (!tokenFamily) {
            throw new AppError(401, "Invalid Credentials");
        }

        const token = jwt.sign(
            { userId: tokenFamily.userId, currentTokenId: newTokenId },
            process.env.REFRESH_SECRET!,
            {
                expiresIn: "30d",
            },
        );

        const currentTokenHash = await bcrypt.hash(token, 12);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const data = {
            currentTokenHash,
            currentTokenId: newTokenId,
            previousTokenId: currentTokenId,
        };

        await this.repo.updateById(tokenFamily.id!, data);

        return token;
    }

    public verifyAccessToken(token: string): AccessPayload {
        return jwt.verify(token, process.env.ACCESS_SECRET!) as AccessPayload;
    }

    public async verifyRefreshToken(token: string): Promise<RefreshPayload> {
        const payload = jwt.verify(
            token,
            process.env.REFRESH_SECRET!,
        ) as jwt.JwtPayload;

        const family = await this.repo.findByTokenId(payload.currentTokenId);
        if (family) {
            const isMatch = await bcrypt.compare(
                token,
                family.currentTokenHash,
            );

            if (!isMatch) {
                throw new AppError(400, "Invalid Token");
            }

            return payload as RefreshPayload;
        }

        const consumed = await this.repo.findByPreviousTokenId(
            payload.currentTokenId,
        );
        if (consumed) {
            await this.repo.revokeById(consumed.id!);
            throw new AppError(
                401,
                "Security violation detected. Please re-authenticate.",
            );
        }

        throw new AppError(401, "Invalid token");
    }

    public async revokeRefreshToken(token: string): Promise<void> {
        const payload = jwt.verify(
            token,
            process.env.REFRESH_SECRET!,
        ) as RefreshPayload;
        await this.repo.revokeByTokenId(payload.currentTokenId);
    }
}
