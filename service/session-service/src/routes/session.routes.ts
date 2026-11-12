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
router.post("/:sessionId/invite", controller.createInvite.bind(controller));
router.post("/join/:token", controller.joinInvite.bind(controller));

export default router;

// for session invitations, the guest user will be authenticated using jwt,
// for that I will connect the auth service using grpc, to create jwt credentials,
// the flow will be as this:
//
// user creates invitation - he can mention the user email, or not
// there will be invitation document created with the userId if the guest is a
//    registered user, and the email will be added if provided
// the guest will click on the invitation - the email will be verified if provided,
// a new participant document will be created - the participant id and role will be
//    parsed to auth service to create jwt credentials using grpc
// for now it will be a fixed access token without refresh
// api gateway will check verify the access token whether it is guest / user
//
