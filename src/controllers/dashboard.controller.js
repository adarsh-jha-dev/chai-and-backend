import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const GetChannelStats = asyncHandler(async (req, res) => {
  try {
    const channelStats = await User.aggregate([
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "allVideos",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
              },
            },
            {
              $addFields: {
                likesCount: { $size: "$likes" },
              },
            },
            {
              $project: {
                likes: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $addFields: {
          totalSubscribers: { $size: "$subscribers" },
          totalVideos: "$allVideos",
          totalViews: { $sum: "$allVideos.views" },
          totalLikes: { $sum: "$allVideos.likesCount" },
        },
      },
      {
        $project: {
          totalVideos: 1,
          totalViews: 1,
          totalLikes: 1,
          totalSubscribers: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          coverImage: 1,
        },
      },
    ]);

    if (channelStats.length < 1) {
      throw new ApiError(400, "channel not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, channelStats, "channel stats fetched successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const GetChannelVideos = asyncHandler(async (req, res) => {
  try {
    const videos = await Video.aggregate([
      {
        $match: {
          _id: {
            $ne: null,
          },
          isPublished: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $first: "$owner" },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

export { GetChannelStats, GetChannelVideos };
