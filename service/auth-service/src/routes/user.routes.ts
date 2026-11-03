import { AuthController } from "@/controllers/auth.controller";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const controller = container.resolve(AuthController);

// users
router.post("/logout", controller.logout.bind(controller));
router.get("/me", controller.me.bind(controller));

export default router;