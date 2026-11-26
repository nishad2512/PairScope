export interface UserProfile {
    id: string;
    displayName: string;
    avatarUrl: string;
}

export interface IAuthService {
    getUserProfiles(userIds: string[]): Promise<UserProfile[]>;
    getUserData(
        email: string,
    ): Promise<{ id: string; email: string; displayName: string } | null>;
}
