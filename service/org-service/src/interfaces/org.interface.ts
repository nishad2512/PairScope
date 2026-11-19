import { orgs } from "../models/organization.model";
import { CreateOrgDTO } from "../validators/org.validator";
import { Request, Response } from "express";

export type IOrg = typeof orgs.$inferSelect;

export interface IOrgRepository {
    create(org: typeof orgs.$inferInsert): Promise<IOrg>;
    getOrgById(orgId: string): Promise<IOrg | null>
    getOrgBySlug(slug: string): Promise<IOrg | null>
    getOrgsByOwner(ownerId: string): Promise<IOrg[]>
}

export interface IOrgService {
    create(dto: CreateOrgDTO, ownerId: string): Promise<IOrg>;
    getOrgs(ownerId: string): Promise<IOrg[]>;
    getOrgById(orgId: string): Promise<IOrg>;
    getOrgBySlug(slug: string): Promise<IOrg>;
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