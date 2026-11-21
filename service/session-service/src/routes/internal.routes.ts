import { Router } from "express";
import { container } from "tsyringe";
import { SessionController } from "@/controllers/session.controller";
import { verifyService } from "@/middlewares/auth.middleware";
import validate from "@/middlewares/validation";
import { realtimeAccessSchema } from "@/validators/session.validator";

const router = Router();
const controller = container.resolve(SessionController);

router.post(
    "/realtime/authorize",
    verifyService,
    validate(realtimeAccessSchema),
    controller.authorizeRealtime.bind(controller),
);

export default router;
