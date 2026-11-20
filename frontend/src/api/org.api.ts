import { API_ROUTES } from '../constants/api.routes';
import { apiClient } from './client';
import type {
    CreatedOrg,
    MemberRole,
    OrgMember,
    Organization,
} from '../types/api.types';

export async function createOrg(input: {
    name: string;
    slug: string;
    password: string;
}): Promise<CreatedOrg> {
    const body = (await apiClient.post(
        API_ROUTES.ORGANIZATIONS.BASE,
        input,
    )) as unknown as { data: CreatedOrg };
    return body.data;
}

export async function getMyOrgs(): Promise<Organization[]> {
    const body = (await apiClient.get(
        API_ROUTES.ORGANIZATIONS.BASE,
    )) as unknown as { data: Organization[] };
    return body.data;
}

export async function getOrgById(orgId: string): Promise<Organization> {
    const body = (await apiClient.get(
        API_ROUTES.ORGANIZATIONS.BY_ID(orgId),
    )) as unknown as { data: Organization };
    return body.data;
}

export async function getOrgBySlug(slug: string): Promise<Organization> {
    const body = (await apiClient.get(API_ROUTES.ORGANIZATIONS.BY_SLUG, {
        headers: { 'x-org-subdomain': slug },
    })) as unknown as { data: Organization };
    return body.data;
}

export async function getMembers(orgId: string): Promise<OrgMember[]> {
    const body = (await apiClient.get(
        API_ROUTES.ORGANIZATIONS.MEMBERS(orgId),
    )) as unknown as { data: OrgMember[] };
    return body.data;
}

export async function addMember(
    orgId: string,
    input: { userId: string; role: MemberRole },
): Promise<OrgMember> {
    const body = (await apiClient.post(
        API_ROUTES.ORGANIZATIONS.MEMBERS(orgId),
        input,
    )) as unknown as { data: OrgMember };
    return body.data;
}

export async function removeMember(
    orgId: string,
    memId: string,
): Promise<void> {
    await apiClient.delete(API_ROUTES.ORGANIZATIONS.MEMBER(orgId, memId));
}