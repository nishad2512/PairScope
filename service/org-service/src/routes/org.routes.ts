import { OrgController } from "@/controllers/org.controller";
import { getUser } from "@/middlewares/auth.middleware";
import validate from "@/middlewares/validation";
import { createOrgSchema } from "@/validators/org.validator";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const controller = container.resolve(OrgController);

router.use(getUser);

router.post("/", validate(createOrgSchema), controller.create.bind(controller));
router.get("/", controller.getUserOrgs.bind(controller));
router.get("/organization", controller.getOrgBySlug.bind(controller));
router.get("/:orgId", controller.getOrgById.bind(controller));

export default router;


// membership invitation need proper flow
// for now hardcode the userId
// there should be proper authorization for a user who tries to add another member
// check for his role in the org
// check whether the user already has a membership in a organizatioin
// membership needs proper indexing for userId with orgId, and memberId with orgId.