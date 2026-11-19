import { StatusCode } from "@/utils/StatusEnum";
import { NextFunction, Request, Response } from "express";

export const getUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        const userPayloadHeader = req.headers["x-user-payload"];

        const userPayload = userPayloadHeader
            ? JSON.parse(userPayloadHeader as string)
            : null;

        req.user = userPayload;

        return next();
    } catch (error) {
        return res
            .status(StatusCode.Unauthorized)
            .json({ message: "Invalid user payload header" });
    }
};
