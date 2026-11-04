import { AuthController } from "@/controllers/auth.controller";
import { getUser } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { container } from "tsyringe";

const router = Router();
const controller = container.resolve(AuthController);

// users

router.use(getUser);

router.post("/logout", controller.logout.bind(controller));
router.get("/me", controller.me.bind(controller));

export default router;
