import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const UploadNewVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoFileLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    const owner = req.user._id;

    if (!title || !description || !videoFileLocalPath || !thumbnailLocalPath) {
      throw new ApiError(400, "Please provide all the content fields");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
      throw new ApiError(500, "Some error occured while uploading the content");
    }

    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      owner,
      title,
      description,
      duration: 0, // TODO : logic for getting the duration of the video as a string
      isPublished: true,
    });

    if (!video) {
      throw new ApiError(500, "Something went wrong while uploading the video");
    }

    return res.json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

const DeleteVideo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.body;
    const user = req.user;
    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      throw new ApiError(404, "No such videos");
    }

    if (existingVideo.owner !== user._id) {
      throw new ApiError(401, "Unauthorized action");
    }

    const deletedVideo = await deleteFromCloudinary(existingVideo.videoFile);
    const deletedThumbnail = await deleteFromCloudinary(
      existingVideo.thumbnail
    );

    if (!deletedVideo || !deletedThumbnail) {
      throw new ApiError(500, "Something went wrong while deleting the video");
    }

    const deletedItem = await Video.findByIdAndDelete(id);
    if (!deletedItem) {
      throw new ApiError(500, "Something went wrong while deleting the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export { UploadNewVideo, DeleteVideo };
