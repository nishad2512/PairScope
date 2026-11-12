import { UserService } from "@/services/user.service";
import { inject, injectable } from "tsyringe";
import grpc from "@grpc/grpc-js";
import { TokenService } from "@/services/token.service";

@injectable()
export class GrpcController {
    constructor(
        @inject("UserService") private readonly serv: UserService,
        @inject("ITokenService") private readonly tokServ: TokenService,
    ) {}

    public async getUserData(call: any, callback: any) {
        try {
            const result = await this.serv.getUser(call.request.email);

            callback(null, result);
        } catch (err: any) {
            console.error(err.message);
            callback({
                code: grpc.status.INTERNAL,
                message: err.message || "User data retrievel failed",
            });
        }
    }

    public setGuestUser(call: any, callback: any) {
        try {
            const result = this.tokServ.generateGuestToken(
                call.request.partId,
                call.request.sessionId,
                call.request.role,
            );

            callback(null, result);
        } catch (err: any) {
            console.error(err.message);
            callback({
                code: grpc.status.INTERNAL,
                message: err.message || "Guest user setting failed",
            });
        }
    }
}
