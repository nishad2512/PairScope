import createGrpcClient from "@/grpc/client";
import { IAuthUser } from "@/interfaces/session.interface";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import * as grpc from "@grpc/grpc-js";

const authClient = createGrpcClient(
    "proto/auth.proto",
    "auth.AuthService",
    process.env.GRPC_AUTH_URL ?? "localhost:50051",
) as any;

export const getUserData = (email: string): Promise<IAuthUser | null> => {
    return new Promise((resolve, reject) => {
        authClient.GetUserData(
            { email },
            { deadline: new Date(Date.now() + 3000) },
            (error: grpc.ServiceError | null, user: IAuthUser) => {
                if (error?.code === grpc.status.NOT_FOUND) {
                    resolve(null);
                } else if (error) {
                    reject(
                        new AppError(
                            StatusCode.ServiceUnavailable,
                            "User lookup is temporarily unavailable",
                        ),
                    );
                } else {
                    resolve(user?.id ? user : null);
                }
            },
        );
    });
};

export const setGuestUser = (
    partId: string,
    sessionId: string,
    role: string,
): Promise<{ token: string }> => {
    return new Promise((resolve, reject) => {
        authClient.SetGuestUser(
            { partId, sessionId, role },
            { deadline: new Date(Date.now() + 3000) },
            (error: grpc.ServiceError | null, data: { token: string }) => {
                if (error || !data?.token) {
                    reject(
                        new AppError(
                            StatusCode.ServiceUnavailable,
                            "Guest access could not be created. Please try again.",
                        ),
                    );
                    return;
                }
                resolve(data);
            },
        );
    });
};
