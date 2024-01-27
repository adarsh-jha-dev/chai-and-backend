import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  DeleteVideo,
  UpdateContent,
  UpdateTitleOrDescriptionOrThumbnail,
  UploadNewVideo,
  addVideoToWatchHistory,
  fetchWatchHistory,
  getAllVideos,
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
router.route("/getvideos").get(verifyJWT, getAllVideos);
router.route("/delete/:id").delete(verifyJWT, DeleteVideo);
router
  .route("/updatecontent/:id")
  .patch(
    verifyJWT,
    upload.single("thumbnail"),
    UpdateTitleOrDescriptionOrThumbnail
  );
router.route("/updatevideocontent/:id").patch(verifyJWT, UpdateContent);
router.route("/get/:id").get(getVideoById);
router.route("/togglepublish/:id").patch(verifyJWT, togglePublishStatus);
router.route("/watch/:id").patch(verifyJWT, addVideoToWatchHistory);
router.route("/history").get(verifyJWT, fetchWatchHistory);

export default router;
