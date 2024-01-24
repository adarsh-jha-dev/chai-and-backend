import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  GetUserChannelSubscribers,
  ToggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.route("/toggle/:id").post(verifyJWT, ToggleSubscription);
router.route("/getsubscribers/:id").get(GetUserChannelSubscribers);

export default router;
