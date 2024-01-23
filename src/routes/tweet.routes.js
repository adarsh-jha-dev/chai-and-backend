import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  CreateTweet,
  DeleteTweet,
  GetUserTweets,
  UpdateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/uploadnew").post(verifyJWT, CreateTweet);
router.route("/update/:id").put(verifyJWT, UpdateTweet);
router.route("/delete/:id").delete(verifyJWT, DeleteTweet);
router.route("/get/:id").get(GetUserTweets);

export default router;
