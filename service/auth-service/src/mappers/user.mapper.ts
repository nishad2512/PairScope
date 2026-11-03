import { IUser } from "@/models/user.model";

export function toUserResponse(user: IUser) {
    return {
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        tier: user.tier,
        avatar: user.avatarUrl
    }
}