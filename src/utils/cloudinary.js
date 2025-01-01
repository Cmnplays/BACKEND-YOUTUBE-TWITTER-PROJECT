import { v2 as cloudinary } from 'cloudinary';
import apiError from './apiError.js';
import fs from 'fs';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error('file path not correct');
    }
    const uploadRes = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto'
    });
    console.log('file is uploaded on cloudinary ', uploadRes.url);
    fs.unlinkSync(localFilePath);
    return uploadRes;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export const deleteFromCloudinary = async (publicFilePath) => {
  if (!publicFilePath) {
    console.log('file path not correct');
    return null;
  }
  const deleteRes = await cloudinary.uploader.destroy(publicFilePath);
  if (!deleteRes) {
    console.error('Internal server Problem in deleting file from cloudinary');
  } else {
    console.log('file is deleted from cloudinary ', publicFilePath);
    return deleteRes;
  }
};

export default uploadOnCloudinary;
