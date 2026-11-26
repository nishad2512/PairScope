import { API_ROUTES } from "../constants/api.routes";
import { apiClient } from "./client";
import type {
    CreatedOrg,
    MemberRole,
    OrgMember,
    Organization,
} from "../types/api.types";

export async function createOrg(input: {
    name: string;
    slug: string;
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
        headers: { "x-org-subdomain": slug },
    })) as unknown as { data: Organization };
    return body.data;
}

export async function getMembers(
    orgId: string,
): Promise<{ members: OrgMember[]; currentUserId: string }> {
    const body = (await apiClient.get(
        API_ROUTES.ORGANIZATIONS.MEMBERS(orgId),
    )) as unknown as { data: OrgMember[]; currentUserId: string };
    return { members: body.data, currentUserId: body.currentUserId };
}

export interface OrganizationInvitation {
    invitation?: { expiresAt: string };
    token: string;
    emailStatus: "queued" | "failed";
}

export async function inviteMember(
    orgId: string,
    input: { email: string; role: MemberRole },
): Promise<OrganizationInvitation> {
    const body = (await apiClient.post(
        `/organizations/${orgId}/invite`,
        input,
    )) as unknown as { data: OrganizationInvitation };
    return body.data;
}

export async function joinOrganization(token: string): Promise<OrgMember> {
    const body = (await apiClient.post(
        `/organizations/join/${encodeURIComponent(token)}`,
        {},
    )) as unknown as { data: OrgMember };
    return body.data;
}

export async function removeMember(
    orgId: string,
    memId: string,
): Promise<void> {
    await apiClient.delete(API_ROUTES.ORGANIZATIONS.MEMBER(orgId, memId));
}
