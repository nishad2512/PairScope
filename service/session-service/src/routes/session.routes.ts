import { Router } from "express";
import { SessionController } from "@/controllers/session.controller";
import { container } from "tsyringe";
import validate from "@/middlewares/validation";
import { getUser } from "@/middlewares/auth.middleware";
import { createSessionSchema } from "@/validators/session.validator";

const router = Router();
const controller = container.resolve(SessionController);

router.use(getUser);

router.get("/", controller.getAllForUser.bind(controller));
router.post(
    "/",
    validate(createSessionSchema),
    controller.create.bind(controller),
);

export default router;
