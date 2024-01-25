import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  AddVideoToPlaylist,
  CreatePlaylist,
  DeletePlaylist,
  GetPlaylistById,
  GetUserPlaylists,
  RemoveVideoFromPlaylist,
  UpdatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/create").post(verifyJWT, CreatePlaylist);
router.route("/getbyuser/:id").get(verifyJWT, GetUserPlaylists);
router.route("/get/:id").get(verifyJWT, GetPlaylistById);
router
  .route("/addvideo/:playlistId/:videoId")
  .patch(verifyJWT, AddVideoToPlaylist);
router
  .route("/removevideo/:playlistId/:videoId")
  .patch(verifyJWT, RemoveVideoFromPlaylist);
router.route("/delete/:playlistId").delete(verifyJWT, DeletePlaylist);
router.route("/update/:playlistId").patch(verifyJWT, UpdatePlaylist);

export default router;
