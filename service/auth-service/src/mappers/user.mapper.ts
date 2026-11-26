import { IUser } from "@/models/user.model";

export function toUserResponse(user: IUser) {
    return {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        tier: user.tier,
        avatar: user.avatarUrl,
    };
}
export function toUserProfile(
    user: Pick<IUser, "id" | "displayName" | "avatarUrl">,
) {
    return {
        id: user.id!,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? "",
    };
}

export function toAuthUser(user: IUser) {
    return {
        ...toUserProfile(user),
        email: user.email,
        role: user.role ?? "",
        tier: user.tier ?? "",
    };
}
