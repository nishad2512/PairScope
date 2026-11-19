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
router.get("/:orgId", controller.getOrgById.bind(controller));
router.get("/:slug", controller.getOrgBySlug.bind(controller));

export default router;
