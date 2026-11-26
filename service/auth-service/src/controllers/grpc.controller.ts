import { inject, injectable } from "tsyringe";
import * as grpc from "@grpc/grpc-js";
import {
    AuthUser,
    IUserLookupService,
    UserProfile,
} from "@/interfaces/user.interface";
import { IGuestTokenService } from "@/interfaces/refresh.interface";
import {
    userLookupSchema,
    userProfilesSchema,
    guestTokenSchema,
} from "@/validators/grpc.validator";
import { grpcError } from "@/middlewares/grpc-error";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";

@injectable()
export class GrpcController {
    constructor(
        @inject("IUserLookupService")
        private readonly users: IUserLookupService,
        @inject("ITokenService") private readonly tokens: IGuestTokenService,
    ) {}

    async getUserData(
        call: grpc.ServerUnaryCall<{ email: string }, AuthUser>,
        callback: grpc.sendUnaryData<AuthUser>,
    ) {
        try {
            const { email } = userLookupSchema.parse(call.request);
            const user = await this.users.getUser(email);
            if (!user)
                throw new AppError(StatusCode.NotFound, "User not found");
            callback(null, user);
        } catch (error) {
            callback(grpcError(error));
        }
    }

    async getUserProfiles(
        call: grpc.ServerUnaryCall<
            { userIds: string[] },
            { users: UserProfile[] }
        >,
        callback: grpc.sendUnaryData<{ users: UserProfile[] }>,
    ) {
        try {
            const { userIds } = userProfilesSchema.parse(call.request);
            callback(null, {
                users: await this.users.getUserProfiles(userIds),
            });
        } catch (error) {
            callback(grpcError(error));
        }
    }

    setGuestUser(
        call: grpc.ServerUnaryCall<
            { partId: string; sessionId: string; role: string },
            { token: string }
        >,
        callback: grpc.sendUnaryData<{ token: string }>,
    ) {
        try {
            const { partId, sessionId, role } = guestTokenSchema.parse(
                call.request,
            );
            callback(null, {
                token: this.tokens.generateGuestToken(partId, sessionId, role),
            });
        } catch (error) {
            callback(grpcError(error));
        }
    }
}
