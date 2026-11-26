import { IInvitationRepository } from "@/interfaces/invitation.interface";
import { IMemberRepository } from "@/interfaces/membership.interface";
import { IOrgRepository } from "@/interfaces/org.interface";
import { db } from "@/config/db";
import { IInvitationTransaction } from "@/interfaces/invitation.interface";
import { InvitationRepository } from "./invitation.repository";
import { MemberRepository } from "./membership.repository";
import { OrgRepository } from "./org.repository";

export class InvitationTransaction implements IInvitationTransaction {
    run<T>(
        action: (repositories: {
            invitations: IInvitationRepository;
            members: IMemberRepository;
            orgs: IOrgRepository;
        }) => Promise<T>,
    ): Promise<T> {
        return db.transaction((tx) =>
            action({
                invitations: new InvitationRepository(tx),
                members: new MemberRepository(tx),
                orgs: new OrgRepository(tx),
            }),
        );
    }
}
