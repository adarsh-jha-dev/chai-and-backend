import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
// const extractPublicIdFromUrl = (url) => {
//   const parts = url.split("/");
//   const fileName = parts[parts.length - 1];
//   const publicId = fileName.split(".")[0];
//   return publicId;
// };

const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return null;
    const deletedResponse = await cloudinary.uploader.destroy(url, {
      resource_type: "auto",
    });
    return deletedResponse;
  } catch (error) {
    return null;
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

export { uploadOnCloudinary, deleteFromCloudinary, trimVideo };
