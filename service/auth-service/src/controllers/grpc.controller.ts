import { UserService } from "@/services/user.service";
import { inject, injectable } from "tsyringe";
import grpc from "@grpc/grpc-js"

@injectable()
export class GrpcController {
    constructor(@inject("UserService") private readonly serv: UserService) {};

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
}