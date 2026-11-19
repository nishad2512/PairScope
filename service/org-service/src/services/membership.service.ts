import {
    IMemberRepository,
    IMemberService,
    IOrgMember,
} from "@/interfaces/membership.interface";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { inject, injectable } from "tsyringe";

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@injectable()
export class MemberService implements IMemberService {
    constructor(
        @inject("IMemberService") private readonly memRepo: IMemberRepository,
    ) {}

    async getMembersByOrg(orgId: string): Promise<IOrgMember[]> {
        const isValidUuid = uuidRegex.test(orgId);
        if (!isValidUuid) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid organization credentials",
            );
        }
        return await this.memRepo.getMembersByOrg(orgId);
    }

    async getMemberById(memId: string, orgId: string): Promise<IOrgMember> {
        const member = await this.memRepo.getMemberById(memId, orgId);
        if (!member) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid member or organization credentials",
            );
        }

        return member;
    }

    async deleteMember(memId: string, orgId: string): Promise<void> {
        await this.memRepo.deleteMember(memId, orgId);
    }
}
