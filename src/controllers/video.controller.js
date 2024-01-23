import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  trimVideo,
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
      duration: videoFile.duration,
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
    const { id } = req.params;
    const user = req.user;
    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      throw new ApiError(404, "No such videos");
    }

    if (existingVideo.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    await deleteFromCloudinary(existingVideo.videoFile)
      .then(() => {
        console.log("Video Deleted successfully");
      })
      .catch((e) => {
        console.log(e);
        throw new ApiError(
          500,
          "Something went wrong while deleting the video"
        );
      });
    await deleteFromCloudinary(existingVideo.thumbnail)
      .then(() => {
        console.log(`Thumbnail deleted successfully`);
      })
      .catch((e) => {
        throw new ApiError(
          500,
          "Something went wrong while deleting the thumbnail"
        );
      });

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

const UpdateTitleOrDescriptionOrThumbnail = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    if (video.owner.toString() !== user._id.toString()) {
      throw new ApiError(409, "Unauthorized Action");
    }

    if (!title && !description) {
      throw new ApiError(400, "Nothing to update");
    }

    let newThumbnail;
    if (thumbnailLocalPath) {
      await deleteFromCloudinary(video.thumbnail).then(async () => {
        await uploadOnCloudinary(thumbnailLocalPath)
          .then((response) => {
            newThumbnail = response;
            console.log(`Thumbnail updated successfully`);
          })
          .catch((e) => {
            throw new ApiError(
              500,
              "Something went wrong while updating the thumbnail",
              error
            );
          });
      });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      {
        title: title || video.title,
        description: description || video.description,
        thumbnail: thumbnailLocalPath ? newThumbnail?.url : video.thumbnail,
      },
      {
        new: true,
      }
    );

    if (!updatedVideo) {
      throw new ApiError(400, "Something went wrong while updating the video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Content updated successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error " + error.message);
  }
});

const UpdateContent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { start, end } = req.body;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    if (video.owner.toString() !== user._id.toString()) {
      throw new ApiError(409, "Unauthorized Action");
    }

    const trimmedVideo = await trimVideo(video.videoFile, start, end);
    if (!trimmedVideo) {
      throw new ApiError(404, "Something went wrong while updating the video");
    }
    let newThumbnail;
    if (thumbnailLocalPath) {
      await deleteFromCloudinary(video.thumbnail).then(async () => {
        newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
          .then(() => {
            console.log(`Thumbnail updated successfully`);
          })
          .catch((e) => {
            throw new ApiError(
              500,
              "Something went wrong while updating the thumbnail",
              error
            );
          });
      });
    }

    const updatedContent = await Video.findByIdAndUpdate(id, {
      videoFile: trimmedVideo.url,
      thumbnail: thumbnailLocalPath ? newThumbnail.url : video.thumbnail,
    });

    if (!updatedContent) {
      throw new ApiError(
        400,
        "Something went wrong while updating the video content"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedContent,
          "Video Content updated successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    if (video.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    const updatedStatus = await Video.findByIdAndUpdate(
      id,
      {
        isPublished: !video.isPublished,
      },
      {
        new: true,
      }
    );

    if (!updatedStatus) {
      throw new ApiError(
        409,
        "Something went wrong while updating the status of the video"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedStatus,
          "Publish status updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const videos = await Video.find();
  } catch (error) {}
});

export {
  UploadNewVideo,
  DeleteVideo,
  UpdateTitleOrDescriptionOrThumbnail,
  UpdateContent,
  getVideoById,
  togglePublishStatus,
};
