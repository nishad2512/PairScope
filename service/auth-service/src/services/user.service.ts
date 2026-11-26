import { inject, injectable } from "tsyringe";
import {
    IUserRepo,
    IUserService,
    IUserLookupService,
} from "../interfaces/user.interface";
import { LoginDTO, SignupDTO } from "@/validators/auth.validator";
import AppError from "@/utils/AppError";
import { IHashService } from "@/interfaces/hash.interface";
import {
    toUserResponse,
    toUserProfile,
    toAuthUser,
} from "@/mappers/user.mapper";
import { ITokenService } from "@/interfaces/refresh.interface";
import { IUser } from "@/models/user.model";
import { randomUUID } from "node:crypto";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class UserService implements IUserService, IUserLookupService {
    constructor(
        @inject("IUserRepo") private readonly repo: IUserRepo,
        @inject("ITokenService") private readonly tokenServ: ITokenService,
        @inject("IHashService") private readonly hasher: IHashService,
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

        const passwordHash = await this.hasher.hash(dto.password);

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
            throw new AppError(
                StatusCode.Unauthorized,
                "Incorrect email or password",
            );
        }

        const passwordCheck = await this.hasher.compare(
            dto.password,
            user.password,
        );
        if (!passwordCheck) {
            throw new AppError(
                StatusCode.Unauthorized,
                "Incorrect email or password",
            );
        }

        const publicUser = toUserResponse(user);

        const issuedTokens = await this.issueTokens(user);

        return { user: publicUser, ...issuedTokens };
    }

    public async refresh(token: string) {
        const payload = await this.tokenServ.verifyRefreshToken(token);

        const user = await this.repo.getUserById(payload.userId);
        if (!user) {
            throw new AppError(StatusCode.Unauthorized, "Invalid credentials");
        }

        const accessToken = this.tokenServ.generateAccessToken(
            user.id!,
            user.role as string,
        );
        const refreshToken = await this.tokenServ.rotateRefreshToken(
            payload.currentTokenId,
            randomUUID(),
        );

        return { accessToken, refreshToken };
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

    public async getUser(email: string) {
        const user = await this.repo.getUserByEmail(email);

        return user ? toAuthUser(user) : null;
    }

    public async getUserProfiles(ids: string[]) {
        const users = await this.repo.getUsersByIds([...new Set(ids)]);
        return users.map(toUserProfile);
    }
}
