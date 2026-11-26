import * as grpc from "@grpc/grpc-js";
import { ZodError } from "zod";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

export function grpcError(error: unknown): grpc.ServerErrorResponse {
    if (error instanceof ZodError)
        return Object.assign(new Error("Invalid request"), {
            code: grpc.status.INVALID_ARGUMENT,
        });
    if (error instanceof AppError) {
        const codes: Partial<Record<StatusCode, grpc.status>> = {
            [StatusCode.NotFound]: grpc.status.NOT_FOUND,
            [StatusCode.Unauthorized]: grpc.status.UNAUTHENTICATED,
            [StatusCode.Forbidden]: grpc.status.PERMISSION_DENIED,
            [StatusCode.BadRequest]: grpc.status.INVALID_ARGUMENT,
            [StatusCode.ServiceUnavailable]: grpc.status.UNAVAILABLE,
        };
        return Object.assign(new Error(error.message), {
            code: codes[error.statusCode] ?? grpc.status.INTERNAL,
        });
    }
    console.error("Auth gRPC request failed");
    return Object.assign(new Error("Auth service is temporarily unavailable"), {
        code: grpc.status.INTERNAL,
    });
}
