import { inject, injectable } from "tsyringe";
import { IUserRepo } from "../interfaces/user.interface";
import { LoginDTO, SignupDTO } from "@/validators/auth.validator";
import AppError from "@/utils/AppError";
import bcrypt from "bcrypt";
import { toUserResponse } from "@/mappers/user.mapper";
import { ITokenService } from "@/interfaces/refresh.interface";
import { IUser } from "@/models/user.model";
import { randomUUID } from "node:crypto";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class UserService {
    constructor(
        @inject("IUserRepo") private readonly repo: IUserRepo,
        @inject("ITokenService") private readonly tokenServ: ITokenService,
    ) {}

    private async issueTokens(user: IUser) {
        const accessToken = this.tokenServ.generateAccessToken(
            user.id!,
            user.role as string,
        );

        const refreshToken = await this.tokenServ.generateRefreshToken(
            user.id!,
            randomUUID(),
        );

        return { accessToken, refreshToken };
    }

    public async signup(dto: SignupDTO) {
        const email = dto.email.trim().toLowerCase();
        const duplicate = await this.repo.getUserByEmail(email);

        if (duplicate) {
            throw new AppError(StatusCode.Conflict, "The user already exists");
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.repo.createUser({
            displayName: dto.name.trim(),
            password: passwordHash,
            email,
            role: "user",
            tier: "free",
            avatarUrl: null,
        });

        const publicUser = toUserResponse(user);
        const issuedTokens = await this.issueTokens(user);

        return { user: publicUser, ...issuedTokens };
    }

    public async login(dto: LoginDTO) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.repo.getUserByEmail(email);
        if (!user) {
            throw new AppError(StatusCode.BadRequest, "Incorrect email or password");
        }

        const passwordCheck = await bcrypt.compare(dto.password, user.password);
        if (!passwordCheck) {
            throw new AppError(StatusCode.BadRequest, "Incorrect email or password");
        }

        const publicUser = toUserResponse(user);

        const issuedTokens = await this.issueTokens(user);

        return { user: publicUser, ...issuedTokens };
    }

    public async refresh(token: string) {
        const payload = await this.tokenServ.verifyRefreshToken(token);

        const user = await this.repo.getUserById(payload.userId);
        if (!user) {
            throw new AppError(StatusCode.BadRequest, "Invalid credentials");
        }

        const accessToken = this.tokenServ.generateAccessToken(
            user.id!,
            user.role as string,
        );
        const refreshToken = await this.tokenServ.rotateRefreshToken(
            payload.currentTokenId,
            randomUUID(),
        );

        return { accessToken, refreshToken }
    }

    public async logout(token: string) {
        await this.tokenServ.revokeRefreshToken(token);
    }

    public async me(userId: string) {
        const user = await this.repo.getUserById(userId);

        if (!user) {
            throw new AppError(StatusCode.NotFound, "User not found");
        }

        return toUserResponse(user);
    }
}
