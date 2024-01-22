import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  DeleteVideo,
  UpdateContent,
  UpdateTitleOrDescription,
  UploadNewVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/uploadnew").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  UploadNewVideo
);
router.route("/delete/:id").delete(verifyJWT, DeleteVideo);
router.route("/updatecontent/:id").put(verifyJWT, UpdateTitleOrDescription);
router.route("/updatevideocontent/:id").put(verifyJWT, UpdateContent);

export default router;
