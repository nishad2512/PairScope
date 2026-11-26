import type { LoginDTO, SignupDTO } from "@/validators/auth.validator";
import { IUser } from "../models/user.model";

export interface IUserRepo {
    createUser(user: IUser): Promise<IUser>;
    getUserByEmail(email: string): Promise<IUser | null>;
    getUsersByIds(ids: string[]): Promise<IUser[]>;
    getUserById(id: string): Promise<IUser | null>;
    updateUser(id: string, user: Partial<Omit<IUser, "id">>): Promise<void>;
    deleteUser(id: string): Promise<void>;
}

export interface PublicUser {
    displayName: string;
    email: string;
    role: IUser["role"];
    tier: IUser["tier"];
    avatar: string | null;
}
export interface UserProfile {
    id: string;
    displayName: string;
    avatarUrl: string;
}
export interface AuthUser extends UserProfile {
    email: string;
    role: string;
    tier: string;
}
export interface IUserService {
    signup(
        dto: SignupDTO,
    ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }>;
    login(
        dto: LoginDTO,
    ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }>;
    refresh(
        token: string,
    ): Promise<{ accessToken: string; refreshToken: string }>;
    logout(token: string): Promise<void>;
    me(userId: string): Promise<PublicUser>;
}
export interface IUserLookupService {
    getUser(email: string): Promise<AuthUser | null>;
    getUserProfiles(ids: string[]): Promise<UserProfile[]>;
}
