import { InvitationController } from "@/controllers/invitation.controller";
import { createInvitationSchema } from "@/validators/invitation.validator";
import { MemberController } from "@/controllers/membership.controller";
import { OrgController } from "@/controllers/org.controller";
import {
    getUser,
    verifyService,
    requireRegister,
} from "@/middlewares/auth.middleware";
import validate from "@/middlewares/validation";
import { createOrgSchema } from "@/validators/org.validator";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const orgController = container.resolve(OrgController);
const memController = container.resolve(MemberController);
const invitations = container.resolve(InvitationController);

router.use(verifyService, getUser, requireRegister);
router.post("/join/:token", invitations.join.bind(invitations));
router.post(
    "/:orgId/invite",
    validate(createInvitationSchema),
    invitations.create.bind(invitations),
);

router
    .route("/")
    .post(validate(createOrgSchema), orgController.create.bind(orgController))
    .get(orgController.getUserOrgs.bind(orgController));
router.get("/organization", orgController.getOrgBySlug.bind(orgController));
router.get("/:orgId", orgController.getOrgById.bind(orgController));

router.get("/:orgId/members", memController.getOrgMembers.bind(memController));

router
    .route("/:orgId/members/:memId")
    .get(memController.getMemberById.bind(memController))
    .delete(memController.deleteMember.bind(memController));

export default router;
