import { members } from "@/models/membership.model";
import { Transaction } from "@/types/database.types";
import { CreateMemberDTO } from "@/validators/org.validator";
import { Request, Response } from "express";

export type IOrgMember = typeof members.$inferSelect;

export interface IMemberRepository {
    createTx(
        member: typeof members.$inferInsert,
        tx: Transaction,
    ): Promise<IOrgMember>;
    create(member: typeof members.$inferInsert): Promise<IOrgMember>;
    getMembersByOrg(orgId: string): Promise<IOrgMember[]>;
    getMemberById(memId: string, orgId: string): Promise<IOrgMember | null>;
    deleteMember(memId: string, orgId: string): Promise<void>;
    getMemberByUser(userId: string, orgId: string): Promise<IOrgMember | null>;
}

export interface IMemberService {
    create(
        dto: CreateMemberDTO,
        orgId: string,
        userId: string,
    ): Promise<IOrgMember>;
    getMembersByOrg(orgId: string): Promise<IOrgMember[]>;
    getMemberById(memId: string, orgId: string): Promise<IOrgMember>;
    deleteMember(memId: string, orgId: string): Promise<void>;
}

export interface IMemberController {
    create(req: Request, res: Response): Promise<void>;
    getOrgMembers(req: Request, res: Response): Promise<void>;
    getMemberById(req: Request, res: Response): Promise<void>;
    deleteMember(req: Request, res: Response): Promise<void>;
}
