import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  DeleteVideo,
  UpdateContent,
  UpdateTitleOrDescriptionOrThumbnail,
  UploadNewVideo,
  getVideoById,
  togglePublishStatus,
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
router.route("/updatecontent/:id").put(
  verifyJWT,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  UpdateTitleOrDescriptionOrThumbnail
);
router.route("/updatevideocontent/:id").put(verifyJWT, UpdateContent);
router.route("/get/:id").get(getVideoById);
router.route("/togglepublish/:id").put(verifyJWT, togglePublishStatus);

export default router;
