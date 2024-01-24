import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  AddComment,
  DeleteComment,
  GetVideoComments,
  UpdateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/addcomment/:id").post(verifyJWT, AddComment);
router.route("/getcommets/:id").get(GetVideoComments);
router.route("/update/:id").patch(verifyJWT, UpdateComment);
router.route("/delete/:id").delete(verifyJWT, DeleteComment);

export default router;
