interface AccessPayload { userId: string; sessionId?: string; }

declare global {
    namespace Express {
        interface Request {
            user?: AccessPayload;
        }
    }
}

export {};