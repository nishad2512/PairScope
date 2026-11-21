import { SocketCode } from "@/utils/StatusEnum";

class AppError extends Error {
    constructor(
        public readonly statusCode: SocketCode,
        message: string,
    ) {
        super(message);

        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
