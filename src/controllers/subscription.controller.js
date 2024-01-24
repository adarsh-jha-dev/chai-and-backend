import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";

const ToggleSubscription = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await User.findById(id);
    if (!channel) {
      throw new ApiError(404, "No such channels");
    }
    const isSubsribed = await Subscription.find({
      subscriber: req.user._id,
      channel: channel._id,
    });

    if (isSubsribed.length !== 0) {
      const deleteSubscription = await Subscription.findByIdAndDelete(
        isSubsribed[0]._id
      );
      if (!deleteSubscription) {
        throw new ApiError(400, "Something went wrong while unsubscribing");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deleteSubscription,
            "Channel unsubscribed successfully"
          )
        );
    } else {
      const subscribe = await Subscription.create({
        subscriber: req.user._id,
        channel: channel._id,
      });

      if (!subscribe) {
        throw new ApiError(400, "Something went wrong while subscribing");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, subscribe, "Channel subscribed successfully")
        );
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const GetUserChannelSubscribers = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Channel Id is required");
    }

    const channel = await User.findById(id);

    if (!channel) {
      throw new ApiError(400, "channel not found!");
    }

    const subscriber = await Subscription.aggregate([
      {
        $match: { channel: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribers",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          subscribers: {
            $first: "$subscribers",
          },
        },
      },
      {
        $project: {
          subscribers: 1,
        },
      },
    ]);

    if (subscriber.length == 0) {
      throw new ApiError(404, "No subscriber found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscriber, "fetched subscirber successfully!")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

const GetSubscribedChannels = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Subscriber Id is required");
    }

    const subscriber = await User.findById(id);
    if (!subscriber) {
      throw new ApiError(404, "No such users");
    }

    // TODO : write the aggregation
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error", error);
  }
});

export { ToggleSubscription, GetUserChannelSubscribers };
