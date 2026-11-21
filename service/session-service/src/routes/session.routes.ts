import { Router } from "express";
import { SessionController } from "@/controllers/session.controller";
import { container } from "tsyringe";
import validate from "@/middlewares/validation";
import {
    getUser,
    requireRegister,
    verifyService,
} from "@/middlewares/auth.middleware";
import { createSessionSchema } from "@/validators/session.validator";
import {
    createInviteSchema,
    joinInviteSchema,
} from "@/validators/invite.validator";

const router = Router();
const controller = container.resolve(SessionController);

router.use(verifyService, getUser);
router.post(
    "/join/:token",
    validate(joinInviteSchema),
    controller.joinInvite.bind(controller),
);

router.use(requireRegister);
router.get("/", controller.getAllForUser.bind(controller));
router.post(
    "/",
    validate(createSessionSchema),
    controller.create.bind(controller),
);
router.post(
    "/:sessionId/invite",
    validate(createInviteSchema),
    controller.createInvite.bind(controller),
);

export default router;
