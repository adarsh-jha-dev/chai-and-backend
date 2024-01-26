import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      media_metadata: true,
    });
    // file has been uploaded successfully
    fs.unlinkSync(localFilePath);
    // console.log(response);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

// cloudinary.v2.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );
const extractPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  const publicId = fileName.split(".")[0];
  return publicId;
};

// const deleteImageFromCloudinary = async (url) => {
//   const publicId = extractPublicIdFromUrl(url);
//   try {
//     await cloudinary.uploader.destroy(publicId, (err, res) => {
//       if (err) {
//         console.log(err.message);
//       } else {
//         console.log(`Asset deleted successfully`);
//       }
//     });
//   } catch (error) {
//     throw new ApiError(error.code, error.message);
//   }
// };

// generalized function for deletion of both - videos/images

const deleteFromCloudinary = async (url, resource_type = "image") => {
  try {
    const publicId = extractPublicIdFromUrl(url);
    const deletedAsset = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });

    if (!deletedAsset) {
      throw new ApiError(500, "Something went wrong while deleting the asset");
    }

    console.log(`Asset deleted successfully`);
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server error");
  }
};

const trimVideo = async (url, start, end) => {
  try {
    const publicId = extractPublicIdFromUrl(url);
    const response = await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      resource_type: "video",
      start_offset: start,
      end_offset: end,
      overwrite: true, // new url of the trimmed version
    });

    // console.log(response);
    return response;
  } catch (error) {
    console.error("Error trimming video:", error.message);
    throw new Error("Failed to trim video");
  }
};

export { uploadOnCloudinary, trimVideo, deleteFromCloudinary };
