import { AccessPayload } from "@/interfaces/token.interface";

declare global {
    namespace Express {
        interface Request {
            user?: AccessPayload;
        }
    }
}

export {};