import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const AddComment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    if (!content || content?.trim() === "") {
      throw new ApiError(404, "Empty content");
    }

    const comment = await Comment.create({
      content,
      video: video._id,
      owner: req.user?._id,
    });

    if (!comment) {
      throw new ApiError(500, "Comment creation failed");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment posted successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const GetVideoComments = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const video = await Video.findById(id);
    if (!video) {
      throw new ApiError(404, "No such videos");
    }

    const aggregateComments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $project: {
          content: 1,
          owner: 1,
        },
      },
    ]);

    if (aggregateComments.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], "No comments yet"));
    }

    const comments = await Comment.aggregatePaginate(
      aggregateComments,
      page,
      limit
    );
    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const UpdateComment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new ApiError(404, "No such comments");
    }

    if (comment.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    if (!content || content.trim() === "") {
      throw new ApiError(409, "Nothing to update");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        content,
      },
      { new: true }
    );

    if (!updatedComment) {
      throw new ApiError(
        500,
        "Something went wrong while updating the comment"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const DeleteComment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new ApiError(404, "No such comments");
    }

    if (comment.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    const deletedComment = await Comment.findByIdAndDelete(id);
    if (!deletedComment) {
      throw new ApiError(
        500,
        "Something went wrong while deleting the comment"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

export { AddComment, GetVideoComments, UpdateComment, DeleteComment };
