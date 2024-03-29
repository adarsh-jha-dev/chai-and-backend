import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from the front end
  // validation - not empty, other validations
  // check if the user already exists - search for the username and email in the database
  // check for images
  // check for avatar
  // upload to cloudinary -> get the url from the response

  // create a user object - create entry in db
  // remove password and refresh token from response before sending it to frontend (in future)

  // check for a valid response of user creation
  // if created - return response else error

  const { email, username, fullname, password } = req.body;

  //   console.log(`Email : ${email}`);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files?.coverImage &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(409, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : "";

  if (!avatar) {
    throw new ApiError(409, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    username,
    password,
    coverImage: coverImage?.url || "",
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User created registered successfully")
    );
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // get details from the req.body
  // validate the inputs
  // verify from the database
  // generate access and refresh token
  // send cookies

  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Username or email is invalid");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "No such user exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user?._id);
  const loggedInUser = await User.findById(user._id).select(
    "-passowrd -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(404, "Unauthorized request");
    }

    const decodedRefreshTokenInfo = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshTokenInfo?._id);

    if (!user) {
      throw new ApiError(404, "Unauthorized request");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(error.message);
  }
});

const ChangeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const GetCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Internal server error");
  }
});

const UpdateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullname, email } = req.body;
    if (!fullname && !email) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user?._id);

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullname: fullname ? fullname : user.fullname,
          email: email ? email : user.email,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          "Account Details updated successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const id = req.user?._id;
  await User.findByIdAndUpdate(
    id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const UpdateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar");
    }
    const isDeleted = await deleteFromCloudinary(req.user?.avatar, "image");

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image updated successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const UpdateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover Image is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
      throw new ApiError(400, "Error while updating Cover Image");
    }
    const coverImageUrl = req.user?.coverImage;
    if (coverImageUrl !== "") {
      const deletedCoverImage = await deleteFromCloudinary(
        coverImageUrl,
        "image"
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        coverImage: coverImage.url,
      },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image updated successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;
    if (!username.trim()) {
      throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
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
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscribersCount: 1,
          channelSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "Channel doesn't exist");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server errror");
  }
});

const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullname: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                  {
                    $addFields: {
                      owner: {
                        $first: "$owner",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    // TODO : delete all the other records - videos, comments, subscriptions, likes of the user

    const deletedAvatar = await deleteFromCloudinary(user?.avatar);
    if (!deletedAvatar) {
      throw new ApiError(400, "Some error occured while deleting the avatar");
    }
    if (user.coverImage !== "") {
      const deletedCoverImage = await deleteFromCloudinary(user?.avatar);
      if (!deletedCoverImage) {
        throw new ApiError(
          400,
          "Some error occured while deleting the cover Image"
        );
      }
    }
    const deletingUser = await User.findByIdAndDelete(user?._id);
    if (!deletingUser) {
      throw new ApiError(
        400,
        "Something went wrong while deleting the account"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { deleted: true }, "Account deleted successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  ChangeCurrentPassword,
  GetCurrentUser,
  UpdateAccountDetails,
  UpdateUserAvatar,
  UpdateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  deleteAccount,
};
