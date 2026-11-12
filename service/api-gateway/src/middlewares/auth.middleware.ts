import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { StatusCode } from "@/utils/StatusEnum";
import { AccessPayload } from "@/interfaces/token.interface";

export const verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(StatusCode.Unauthorized)
            .json({ message: "Access Denied: No Token Provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedPayload = jwt.verify(
            token as string,
            process.env.ACCESS_SECRET!,
        );

        req.user = decodedPayload as AccessPayload;
        console.log(req.user);

        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};

export const requireRegister = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (req.user?.sessionId) {
        return res
            .status(StatusCode.Unauthorized)
            .json({ message: "Access Denied: Guest User Restricted" });
    }

    return next();
};
