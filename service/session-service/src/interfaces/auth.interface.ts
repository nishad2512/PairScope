import { IAuthUser } from "./session.interface";

export interface IAuthService {
    getUserData(email: string): Promise<IAuthUser | null>;
    setGuestUser(partId: string, sessionId: string, role: string): Promise<{ token: string }>;
}
