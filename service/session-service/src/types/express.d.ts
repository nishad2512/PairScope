import { AccessPayload } from "../interfaces/session.interface";

declare global {
    namespace Express {
        interface Request {
            user?: AccessPayload;
        }
    }
}

export {};
