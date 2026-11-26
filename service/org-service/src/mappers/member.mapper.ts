import { IOrgMember, MemberProfile } from "@/interfaces/membership.interface";

export function toMemberResponse(
    member: IOrgMember &
        Partial<Pick<MemberProfile, "displayName" | "avatarUrl">>,
) {
    return {
        id: member.id,
        orgId: member.orgId,
        userId: member.userId,
        displayName: member.displayName ?? "Name unavailable",
        avatarUrl: member.avatarUrl ?? null,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
    };
}
