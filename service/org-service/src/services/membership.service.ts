import {
    IMemberRepository,
    IMemberService,
    IOrgMember,
} from "@/interfaces/membership.interface";
import AppError from "@/utils/AppError";
import { StatusCode } from "@/utils/StatusEnum";
import { CreateMemberDTO } from "@/validators/org.validator";
import { inject, injectable } from "tsyringe";

const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@injectable()
export class MemberService implements IMemberService {
    constructor(
        @inject("IMemberRepository") private readonly memRepo: IMemberRepository,
    ) {}

    async create(
        dto: CreateMemberDTO,
        orgId: string,
        userId: string,
    ): Promise<IOrgMember> {
        const isValidOrg = uuidRegex.test(orgId);
        if (!isValidOrg) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid organization credentials",
            );
        }

        const userAuth = await this.memRepo.getMemberByUser(userId, orgId);
        if (!userAuth || userAuth.role === "INTERVIEWER") {
            throw new AppError(
                StatusCode.Unauthorized,
                "You are not authorized to do this action",
            );
        }

        return await this.memRepo.create({
            ...dto,
            orgId,
        });
    }

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
        const isValidMem = uuidRegex.test(memId);
        const isValidOrg = uuidRegex.test(orgId);

        if (!isValidMem || !isValidOrg) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid member credentials",
            );
        }

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
        const isValidMem = uuidRegex.test(memId);
        const isValidOrg = uuidRegex.test(orgId);

        if (!isValidMem || !isValidOrg) {
            throw new AppError(
                StatusCode.BadRequest,
                "Invalid member credentials",
            );
        }
        await this.memRepo.deleteMember(memId, orgId);
    }
}
