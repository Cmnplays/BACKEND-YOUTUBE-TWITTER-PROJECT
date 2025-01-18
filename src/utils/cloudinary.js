import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { apiError } from "../utils/apiError.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      return null;
    }
    const uploadRes = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      public_id: Date.now()
    });
    if (!uploadRes) {
      throw new apiError(500, "error");
    }
    fs.unlinkSync(localFilePath);
    return uploadRes;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.log(error);
    return null;
  }
};

export const deleteFromCloudinary = async (publicFilePath) => {
  if (!publicFilePath) {
    console.log("file path not correct");
    return null;
  }
  const deleteRes = await cloudinary.uploader.destroy(publicFilePath);
  if (!deleteRes) {
  } else {
    return deleteRes;
  }
};
