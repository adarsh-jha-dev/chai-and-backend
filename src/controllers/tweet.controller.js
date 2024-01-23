import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const CreateTweet = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Please provide some content");
    }

    const tweet = await Tweet.create({
      content,
      owner: user._id,
    });

    if (!tweet) {
      throw new ApiError(500, "Some error occured while uploading the tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet uploaded successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const GetUserTweets = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const tweets = await Tweet.find({
      owner: id,
    });

    if (!tweets) {
      throw new ApiError(404, "No tweets found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Intenral server error");
  }
});

const UpdateTweet = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { content } = req.body;
    const tweet = await Tweet.findById(id);
    if (!tweet) {
      throw new ApiError(404, "No such tweets");
    }

    if (tweet.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }
    if (!content) {
      throw new ApiError(409, "Nothing to update");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
      id,
      {
        content,
      },
      {
        new: true,
      }
    );

    if (!updatedTweet) {
      throw new ApiError(500, "Something went wrong while updating the tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const DeleteTweet = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const tweet = await Tweet.findById(id);
    if (!tweet) {
      throw new ApiError(404, "No such tweets");
    }

    if (tweet.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(id);

    if (!deletedTweet) {
      throw new ApiError(500, "Something went wrong while deleting the tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

export { CreateTweet, UpdateTweet, DeleteTweet, GetUserTweets };
