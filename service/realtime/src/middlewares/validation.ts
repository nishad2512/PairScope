import { ZodType } from "zod";
import AppError from "@/utils/AppError";
import { SocketCode } from "@/utils/StatusEnum";

const validate = <T>(schema: ZodType<T>, payload: unknown): T => {
    const result = schema.safeParse(payload);

    if (!result.success) {
        throw new AppError(
            SocketCode.InvalidPayload,
            "The event payload is invalid.",
        );
    }

    return result.data;
};

export default validate;
