import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import { apiError } from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  if (!sortBy) {
    sortBy = 'createdAt';
  }
  if (!isNaN(sortType)) {
    sortType = 1;
  }
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return new apiError(400, 'Invalid user id');
  }

  const videos = await Video.find({
    owner: new mongoose.Types.ObjectId(userId)
  })
    .skip((Number(page) - 1) * limit)
    .limit(Number(limit))
    .sort({ [sortBy]: Number(sortType) });

  return res
    .status(200)
    .json(new apiResponse(200, videos, 'Successfully send videos'));

  //TODO1: writing logic for the query part
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  let videoLocalObj;
  let thumbnailLocalObj;
  if (!title) {
    throw new apiError(400, 'Title is missing');
  }
  if (!description) {
    throw new apiError(400, 'Description is missing');
  }
  if (!req.files) {
    throw new apiError(400, 'Thumbnail and video are missing');
  }
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalObj = req.files.videoFile[0];
  }

  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalObj = req.files.thumbnail[0];
  }

  if (!thumbnailLocalObj || !videoLocalObj) {
    throw new apiError(400, 'Thumbnail or video is missing');
  }
  const videoCloudObj = await uploadOnCloudinary(videoLocalObj.path);
  const thumbnailCloudObj = await uploadOnCloudinary(thumbnailLocalObj.path);
  if (!videoCloudObj || !thumbnailCloudObj) {
    throw new apiError(
      500,
      'Failed to upload video or thumbnail to Cloudinary'
    );
  }
  const video = await Video.create({
    videoFile: videoCloudObj.url,
    thumbnail: thumbnailCloudObj.url,
    title,
    description,
    duration: videoCloudObj.duration,
    owner: req.user._id
  });
  if (!video) {
    throw new apiError(
      500,
      'There is a problem while uploading the video, please try again later!'
    );
  }
  return res
    .status(201)
    .json(new apiResponse(201, video, 'Successfully uploaded video.'));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
};
