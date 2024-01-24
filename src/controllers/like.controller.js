import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import { Comment } from "../models/comment.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      throw new ApiError(400, "Video id is required");
    }

    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    const isLiked = await Like.find({
      likedBy: user._id,
      video: video._id,
    });

    if (isLiked.length !== 0) {
      const unLike = await Like.deleteOne({
        likedBy: user._id,
        video: video._id,
      });

      if (!unLike) {
        throw new ApiError(
          400,
          "Something went wrong while unliking the video"
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, unLike, "Video unliked successfully"));
    } else {
      const like = await Like.create({
        likedBy: user._id,
        video: video._id,
        tweet: null,
        comment: null,
      });

      if (!like) {
        throw new ApiError(400, "Something went wrong while liking the video");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, like, "Video liked successfully"));
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      throw new ApiError(400, "Tweet id is required");
    }

    const tweet = await Tweet.findById(id);
    if (!tweet) {
      throw new ApiError(404, "No such tweets");
    }

    const isLiked = await Like.find({
      likedBy: user._id,
      tweet: tweet._id,
    });

    if (isLiked.length !== 0) {
      const unLike = await Like.deleteOne({
        likedBy: user._id,
        tweet: tweet._id,
      });

      if (!unLike) {
        throw new ApiError(
          400,
          "Something went wrong while unliking the video"
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, unLike, "Tweet unliked successfully"));
    } else {
      const like = await Like.create({
        likedBy: user._id,
        tweet: tweet._id,
        video: null,
        comment: null,
      });

      if (!like) {
        throw new ApiError(400, "Something went wrong while liking the video");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, like, "Tweet liked successfully"));
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id) {
      throw new ApiError(400, "Comment id is required");
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new ApiError(404, "No such comment");
    }

    const isLiked = await Like.find({
      likedBy: user._id,
      comment: comment._id,
    });

    if (isLiked.length !== 0) {
      const unLike = await Like.deleteOne({
        likedBy: user._id,
        comment: comment._id,
      });

      if (!unLike) {
        throw new ApiError(
          400,
          "Something went wrong while unliking the comment"
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, unLike, "Comment unliked successfully"));
    } else {
      const like = await Like.create({
        likedBy: user._id,
        comment: comment._id,
        tweet: null,
        video: null,
      });

      if (!like) {
        throw new ApiError(
          400,
          "Something went wrong while liking the comment"
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, like, "Comment liked successfully"));
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: user._id,
          video: {
            $ne: null,
          },
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideos",
        },
      },
      {
        $project: {
          likedVideos: {
            $map: {
              input: "$likedVideos",
              as: "video",
              in: {
                title: "$$video.title",
                description: "$$video.description",
                videoFile: "$$video.videoFile",
                thumbnail: "$$video.thumbnail",
                duration: "$$video.duration",
                views: "$$video.views",
              },
            },
          },
        },
      },
    ]);

    if (likedVideos.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { likedVideos: [] }, "No videos liked yet"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

export { toggleVideoLike, toggleTweetLike, toggleCommentLike, getLikedVideos };
