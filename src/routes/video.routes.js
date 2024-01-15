import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  DeleteVideo,
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
router.route("/delete").delete(verifyJWT, DeleteVideo);

export default router;
