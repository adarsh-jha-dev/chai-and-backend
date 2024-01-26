import { Router } from "express";
import {
  GetChannelStats,
  GetChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(GetChannelStats);
router.route("/videos").get(GetChannelVideos);

export default router;
