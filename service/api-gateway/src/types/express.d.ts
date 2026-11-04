import { AccessPayload } from "../interfaces/refresh.interface";

declare global {
    namespace Express {
        interface Request {
            user?: AccessPayload;
        }
    }
}

export {};