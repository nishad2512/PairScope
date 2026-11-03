import { RequestHandler } from "express";
import { ZodObject } from "zod";

const validate = (schema: ZodObject): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if(!result.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                error: result.error.issues
            });
            return;
        };

        req.body = result.data ?? req.body;
        next();
    }
}

export default validate;