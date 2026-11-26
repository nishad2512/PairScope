import { ErrorRequestHandler } from "express";
import AppError from "../utils/AppError";
import { StatusCode } from "../utils/StatusEnum";

const errHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const failure =
        error && typeof error === "object"
            ? (error as { name?: string; code?: string; type?: string })
            : {};
    let status = StatusCode.InternalServerError;
    let message = "Internal server error";

    if (error instanceof AppError) {
        status = error.statusCode;
        message = error.message;
    } else if (failure.type === "entity.parse.failed") {
        status = StatusCode.BadRequest;
        message = "Invalid JSON body";
    } else if (failure.type === "entity.too.large") {
        status = StatusCode.PayloadTooLarge;
        message = "Request body is too large";
    } else if (failure.code === "23505") {
        status = StatusCode.Conflict;
        message = "This record already exists";
    } else if (
        ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND"].includes(failure.code || "")
    ) {
        status = StatusCode.BadGateway;
        message = "The requested service is unavailable";
    } else if (["ETIMEDOUT", "ESOCKETTIMEDOUT"].includes(failure.code || "")) {
        status = StatusCode.GatewayTimeout;
        message = "The requested service timed out";
    }
    if (status >= StatusCode.InternalServerError)
        console.error("Service request failed", failure.name || "UnknownError");
    return res.status(status).json({ success: false, message });
};

export default errHandler;
