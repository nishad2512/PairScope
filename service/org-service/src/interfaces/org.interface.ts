import { Transaction } from "@/types/database.types";
import { orgs } from "../models/organization.model";
import { CreateOrgDTO } from "../validators/org.validator";
import { Request, Response } from "express";
import { IOrgMember } from "./membership.interface";

export type IOrg = typeof orgs.$inferSelect;

export interface IOrgRepository {
    create(org: typeof orgs.$inferInsert, tx: Transaction): Promise<IOrg>;
    getOrgById(orgId: string): Promise<IOrg | null>;
    getOrgForUpdate(orgId: string): Promise<IOrg | null>;
    getOrgBySlug(slug: string): Promise<IOrg | null>;
    getOrgsByOwner(ownerId: string): Promise<IOrg[]>;
}

export interface IOrgService {
    create(
        dto: CreateOrgDTO,
        ownerId: string,
    ): Promise<{ org: IOrg; member: IOrgMember }>;
    getOrgs(ownerId: string): Promise<IOrg[]>;
    getOrgById(orgId: string, userId: string): Promise<IOrg>;
    getOrgBySlug(slug: string, userId: string): Promise<IOrg>;
}

export interface IOrgController {
    create(req: Request, res: Response): Promise<void>;
    getUserOrgs(req: Request, res: Response): Promise<void>;
    getOrgById(req: Request, res: Response): Promise<void>;
    getOrgBySlug(req: Request, res: Response): Promise<void>;
}

// export interface IOrg {
//     id?: string,
//     name: string,
//     slug: string,
//     password: string,
//     tier: string,
//     tierId: string | null,
//     ownerId: string,
//     isActive: boolean,
//     createdAt?: Date,
//     updatedAt?: Date
// }
