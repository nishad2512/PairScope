import { members } from "@/models/membership.model";
import { Transaction } from "@/types/database.types";
import { Request, Response } from "express";

export type IOrgMember = typeof members.$inferSelect;

export interface IMemberRepository {
    createTx(
        member: typeof members.$inferInsert,
        tx: Transaction,
    ): Promise<IOrgMember>;
    reactivate(id: string, role: IOrgMember["role"]): Promise<IOrgMember>;
    create(member: typeof members.$inferInsert): Promise<IOrgMember>;
    getMembersByOrg(orgId: string): Promise<IOrgMember[]>;
    getMemberById(memId: string, orgId: string): Promise<IOrgMember | null>;
    deleteMember(memId: string, orgId: string): Promise<void>;
    getMemberByUser(userId: string, orgId: string): Promise<IOrgMember | null>;
}

export interface IMemberService {
    getMembersByOrg(orgId: string, userId: string): Promise<IOrgMember[]>;
    getMemberById(
        memId: string,
        orgId: string,
        userId: string,
    ): Promise<IOrgMember>;
    deleteMember(memId: string, orgId: string, userId: string): Promise<void>;
}

export interface IMemberController {
    getOrgMembers(req: Request, res: Response): Promise<void>;
    getMemberById(req: Request, res: Response): Promise<void>;
    deleteMember(req: Request, res: Response): Promise<void>;
}
