import { createHash, timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { accessPayloadSchema } from "@/validators/invitation.validator";
import { StatusCode } from "@/utils/StatusEnum";

export const verifyService = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    const provided = req.headers["x-internal-secret"];

    if (!secret) {
        return res.status(StatusCode.ServiceUnavailable).json({
            message: "Internal service authorization is not configured",
        });
    }

    if (
        typeof provided !== "string" ||
        !timingSafeEqual(
            createHash("sha256").update(secret).digest(),
            createHash("sha256").update(provided).digest(),
        )
    ) {
        return res.status(StatusCode.Unauthorized).json({
            message: "Invalid service credentials",
        });
    }

    return next();
};

export const getUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers["x-user-payload"];
        req.user = header
            ? accessPayloadSchema.parse(JSON.parse(header as string))
            : undefined;
        return next();
    } catch {
        return res.status(StatusCode.Unauthorized).json({
            message: "Invalid user payload header",
        });
    }
};

export const requireRegister = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (!req.user || req.user.sessionId) {
        return res.status(StatusCode.Unauthorized).json({
            message: "Registered user credentials are required",
        });
    }

    return next();
};
