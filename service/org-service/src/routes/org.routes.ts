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
// check for invalid uuid
router.get("/:orgId", controller.getOrgById.bind(controller));

export default router;
