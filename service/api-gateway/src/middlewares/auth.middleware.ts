import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { StatusCode } from "@/utils/StatusEnum";

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

        req.user = decodedPayload;
        console.log(req.user);

        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};
