import createGrpcClient from "@/grpc/client";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

const authClient = createGrpcClient(
    "proto/auth.proto",
    "auth.AuthService",
    process.env.GRPC_AUTH_URL ?? "auth-service:50051",
) as any;

export const getUserData = (email: string) =>
    new Promise((resolve, reject) => {
        authClient.GetUserData({ email }, (error: any, user: any) =>
            error
                ? reject(
                      new AppError(
                          StatusCode.InternalServerError,
                          `There seems a error in getting the user`,
                      ),
                  )
                : resolve(user),
        );
    });

export const setGuestUser = (partId: string, sessionId: string, role: string) =>
    new Promise((resolve, reject) => {
        authClient.SetGuestUser(
            { partId, sessionId, role },
            (err: any, user: any) =>
                err
                    ? reject(
                          new AppError(
                              StatusCode.InternalServerError,
                              "There seems a error in setting guest user",
                          ),
                      )
                    : resolve(user),
        );
    });
