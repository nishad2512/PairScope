import { ErrorRequestHandler } from "express";
import AppError from "../utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

const errHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.message);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    return res.status(StatusCode.InternalServerError).json({
        success: false,
        message: err.message || "Internal server error",
    });
};

export default errHandler;
