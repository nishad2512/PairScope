import { IOrgMember } from "@/interfaces/membership.interface";

export function toMemberResponse(member: IOrgMember) {
    return {
        id: member.id,
        orgId: member.orgId,
        userId: member.userId,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
    };
}
