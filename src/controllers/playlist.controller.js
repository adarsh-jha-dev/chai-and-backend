import mongoose from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const CreatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const user = req.user;

    if (
      !name ||
      name.trim() === "" ||
      !description ||
      description.trim() === ""
    ) {
      throw new ApiError(400, "Name or description is empty");
    }

    const playlist = await Playlist.create({
      name,
      description,
      videos: [],
      owner: user?._id,
    });

    if (!playlist) {
      throw new ApiError(
        400,
        "Something went wrong while creating the playlist"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist created successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const GetUserPlaylists = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "User ID is required");
    }
    const playlists = await Playlist.find({
      owner: id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const GetPlaylistById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Please provide the Playlist ID");
    }

    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videosWithDetails",
        },
      },
      {
        $unwind: "$videosWithDetails",
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          videos: {
            videoFile: "$videosWithDetails.videoFile",
            thumbnail: "$videosWithDetails.thumbnail",
            title: "$videosWithDetails.title",
            description: "$videosWithDetails.description",
            views: "$videosWithDetails.views",
            duration: "$videosWithDetails.duration",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          description: { $first: "$description" },
          owner: { $first: "$owner" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          videos: { $push: "$videos" },
        },
      },
      {
        $unwind: "$videos",
      },
    ]);

    if (!playlist || playlist.length === 0) {
      throw new ApiError(404, "No such playlists");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const AddVideoToPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    const user = req.user;
    if (!playlistId || !videoId) {
      throw new ApiError(400, "Video or playlist is missing");
    }

    const video = await Video.findById(videoId);
    const playlist = await Playlist.findById(playlistId);

    if (!video || !playlist) {
      throw new ApiError(404, "No such video or playlist");
    }

    if (video.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "You're not authorized to add this video");
    }

    if (playlist.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "You're not authorized to add to this playlist");
    }

    if (playlist.videos.includes(videoId)) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            playlist,
            "Video already added into the playlist"
          )
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(400, "Some error occured while adding video");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video added to playlist successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const RemoveVideoFromPlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId, videoId } = req.params;
    const user = req.user;
    if (!playlistId || !videoId) {
      throw new ApiError(400, "Video or playlist is missing");
    }
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, "No such video or playlist");
    }

    if (playlist.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "You're not authorized to edit this playlist");
    }

    if (!playlist.videos.includes(videoId)) {
      return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video not in the playlist"));
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(400, "Some error occured while adding video");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video removed from the playlist successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const DeletePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const user = req.user;
    if (!playlistId) {
      throw new ApiError(400, "Playlist Id is missing");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "No such playlist");
    }

    if (playlist.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "You're not authorized to delete this playlist");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
      throw new ApiError(
        400,
        "Something went wrong while deleting the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const UpdatePlaylist = asyncHandler(async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const user = req.user;

    if (!playlistId) {
      throw new ApiError(400, "Playlist ID is required");
    }

    if (
      !name ||
      name.trim() === "" ||
      !description ||
      description.trim() === ""
    ) {
      throw new ApiError(400, "Name or description is empty");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "No such playlist");
    }

    if (playlist.owner.toString() !== user._id.toString()) {
      throw new ApiError(401, "Unauthorized action");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name,
        description,
      },
      { new: true }
    );

    if (!updatedPlaylist) {
      throw new ApiError(
        400,
        "Something went wrong while updating the playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
  //TODO: update playlist
});

export {
  CreatePlaylist,
  GetPlaylistById,
  GetUserPlaylists,
  AddVideoToPlaylist,
  RemoveVideoFromPlaylist,
  DeletePlaylist,
  UpdatePlaylist,
};
