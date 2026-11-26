export interface IAuthService {
    getUserData(
        email: string,
    ): Promise<{ id: string; email: string; displayName: string } | null>;
}
