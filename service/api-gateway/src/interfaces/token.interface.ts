export interface AccessPayload {
    userId: string;
    role?: string;
    sessionId?: string;
    iat?: number;
    exp?: number;
}