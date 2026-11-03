import { AuthController } from "@/controllers/auth.controller";
import validate from "@/middlewares/validation";
import { loginSchema, signupSchema } from "@/validators/auth.validator";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const controller = container.resolve(AuthController);

// auth
router.post(
    "/signup",
    validate(signupSchema),
    controller.signup.bind(controller),
);
router.post("/login", validate(loginSchema), controller.login.bind(controller));
router.post("/refresh", controller.refresh.bind(controller));

export default router;