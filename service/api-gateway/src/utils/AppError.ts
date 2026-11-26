import { StatusCode } from "./StatusEnum";

export default class AppError extends Error {
    constructor(
        public readonly statusCode: StatusCode,
        message: string,
    ) {
        super(message);
        this.name = "AppError";
    }
}
