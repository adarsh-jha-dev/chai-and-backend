import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  console.log(`Email : ${email}`);

  //   if (
  //     [fullname, email, username, password].some((field) => {
  //       field.toString().trim() === "";
  //     })
  //   ) {
  //     throw new ApiError(400, "All fields are required");
  //   }
  [fullname, email, username, password].map((field) => {
    console.log(field);
  });

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
    req.files.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  console.table(req.files);

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

export { registerUser };
