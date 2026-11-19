import { MemberController } from "@/controllers/membership.controller";
import { OrgController } from "@/controllers/org.controller";
import { getUser } from "@/middlewares/auth.middleware";
import validate from "@/middlewares/validation";
import {
    createMemberSchema,
    createOrgSchema,
} from "@/validators/org.validator";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const orgController = container.resolve(OrgController);
const memController = container.resolve(MemberController);

router.use(getUser);

router
    .route("/")
    .post(validate(createOrgSchema), orgController.create.bind(orgController))
    .get(orgController.getUserOrgs.bind(orgController));
router.get("/organization", orgController.getOrgBySlug.bind(orgController));
router.get("/:orgId", orgController.getOrgById.bind(orgController));

// membership management

// need proper authorization check
router
    .route("/:orgId/members")
    .post(
        validate(createMemberSchema),
        memController.create.bind(memController),
    )
    .get(memController.getOrgMembers.bind(memController));

router
    .route("/:orgId/members/:memId")
    .get(memController.getMemberById.bind(memController))
    .delete(memController.deleteMember.bind(memController));

export default router;

// membership invitation need proper flow
// for now hardcode the userId
// there should be proper authorization for a user who tries to add another member
// check for his role in the org
// check whether the user already has a membership in a organizatioin
// membership needs proper indexing for userId with orgId, and memberId with orgId.
