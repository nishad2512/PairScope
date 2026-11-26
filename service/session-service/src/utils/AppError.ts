import { StatusCode } from "./StatusEnum";
class AppError extends Error {
    constructor(
        public readonly statusCode: StatusCode,
        message: string,
    ) {
        super(message);

        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
