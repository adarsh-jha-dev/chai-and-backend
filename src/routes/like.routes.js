import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/video/:id").patch(verifyJWT, toggleVideoLike);
router.route("/tweet/:id").patch(verifyJWT, toggleTweetLike);
router.route("/comment/:id").patch(verifyJWT, toggleCommentLike);
router.route("/likedvideos").get(verifyJWT, getLikedVideos);

export default router;
