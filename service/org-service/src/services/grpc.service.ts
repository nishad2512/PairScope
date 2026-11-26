import { IAuthService, UserProfile } from "@/interfaces/auth.interface";
import createGrpcClient from "@/grpc/client";
type IAuthUser = { id: string; email: string; displayName: string };
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import * as grpc from "@grpc/grpc-js";

const authClient = createGrpcClient(
    "proto/auth.proto",
    "auth.AuthService",
    process.env.GRPC_AUTH_URL ?? "localhost:50051",
) as any;

export class AuthService implements IAuthService {
    getUserData(email: string): Promise<IAuthUser | null> {
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
    }
    async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
        const profiles: UserProfile[] = [];
        const ids = [...new Set(userIds)];
        for (let index = 0; index < ids.length; index += 200) {
            const result = await new Promise<{ users: UserProfile[] }>(
                (resolve, reject) => {
                    authClient.GetUserProfiles(
                        { userIds: ids.slice(index, index + 200) },
                        { deadline: new Date(Date.now() + 3000) },
                        (
                            error: grpc.ServiceError | null,
                            response: { users: UserProfile[] },
                        ) => {
                            if (error)
                                reject(
                                    new AppError(
                                        StatusCode.ServiceUnavailable,
                                        "Member profiles are unavailable",
                                    ),
                                );
                            else resolve(response);
                        },
                    );
                },
            );
            profiles.push(...result.users);
        }
        return profiles;
    }
}
