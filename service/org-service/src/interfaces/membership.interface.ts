import { members } from "@/models/membership.model";
import { Transaction } from "@/types/database.types";

export type IOrgMember = typeof members.$inferSelect;

export interface IMemberRepository {
    create(
        member: typeof members.$inferInsert,
        tx: Transaction,
    ): Promise<IOrgMember>;
    getMembersByOrg(orgId: string): Promise<IOrgMember[]>;
    getMemberById(memId: string, orgId: string): Promise<IOrgMember | null>;
    deleteMember(memId: string, orgId: string): Promise<void>;
}

export interface IMemberService {
    getMembersByOrg(orgId: string): Promise<IOrgMember[]>;
    getMemberById(memId: string, orgId: string): Promise<IOrgMember>;
    deleteMember(memId: string, orgId: string): Promise<void>;
}