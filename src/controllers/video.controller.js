import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handlePaginationParams } from "../utils/handlePaginationParams.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary
} from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page, limit, query = "", sortBy, sortType, userId } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  if (!isNaN(page)) {
    page = 1;
  }

  if (!isNaN(limit)) {
    limit = 10;
  }

  if (!isValidObjectId(userId)) {
    userId = null;
  }

  if (query !== "title" && query !== "description" && query !== "") {
    query = "";
  }

  if (sortBy !== "title" && sortBy !== "createdAt" && sortBy !== "updatedAt") {
    sortBy = "createdAt";
  }

  if (sortType === "asc") {
    sortType = 1;
  } else if (sortType === "desc") {
    sortType = -1;
  } else {
    sortType = 1;
  }
  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } }
        ]
      }
    },
    {
      $sort: { [sortBy]: sortType }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" }
      }
    },
    //Aggregating Views

    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "video",
        as: "views"
      }
    },
    {
      $addFields: {
        views: {
          $size: "$views"
        }
      }
    }
  ]);

  if (!videos || videos.length === 0) {
    throw new apiError(
      500,
      "There is a problem while fetching videos, please try again later!"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, videos, "Successfully send videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  let videoLocalObj;
  let thumbnailLocalObj;
  if (!title) {
    throw new apiError(400, "Title is missing");
  }
  if (!description) {
    throw new apiError(400, "Description is missing");
  }
  if (!req.files) {
    throw new apiError(400, "Thumbnail and video are missing");
  }
  if (!req.files.videoFile || !req.files.thumbnail) {
    throw new apiError(400, "Video or thumbnail is missing");
  }
  const isVideoExisting = await Video.findOne({
    $or: [{ title }, { description }]
  });
  if (isVideoExisting) {
    await fs.promises.unlink(req.files.videoFile[0]?.path);
    await fs.promises.unlink(req.files.thumbnail[0].path);
    throw new apiError(
      400,
      "A video with the same title or description exists"
    );
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
    throw new apiError(400, "Thumbnail or video is missing");
  }
  const videoCloudObj = await uploadOnCloudinary(videoLocalObj.path);
  const thumbnailCloudObj = await uploadOnCloudinary(thumbnailLocalObj.path);
  console.log({ videoCloudObj, thumbnailCloudObj });
  if (!videoCloudObj || !thumbnailCloudObj) {
    throw new apiError(
      500,
      "Failed to upload video or thumbnail to Cloudinary"
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
      "There is a problem while uploading the video, please try again later!"
    );
  }
  return res
    .status(201)
    .json(new apiResponse(201, video, "Successfully uploaded video."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }
  const video = await Video.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$_id", { $toObjectId: videoId }]
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner"
        }
      }
    },
    //Aggregating Views
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "video",
        as: "views"
      }
    },
    {
      $addFields: {
        views: {
          $size: "$views"
        }
      }
    },
    //Aggregating Likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $addFields: {
        likes: {
          $size: "$likes"
        }
      }
    },
    //Aggregating Comments
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments"
      }
    },
    {
      $addFields: {
        comments: {
          $size: "$comments"
        }
      }
    }
  ]);

  if (!video || video.length === 0) {
    throw new apiError(
      404,
      "No video found with the provided id, please try again later!"
    );
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Successfully send video"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  console.log(req.file);
  if (!req.file) {
    throw new apiError(400, "thumbnail is missing");
  }
  let thumbnailLocalObj = req.file;
  if (!title || !description || !thumbnailLocalObj) {
    throw new apiError(400, "Some fields are missing");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(
      404,
      "There is a problem while fetching the video, please try again later!"
    );
  }
  const oldThumbnailCloudUrl = video.thumbnail;
  const deleteResponse = await deleteFromCloudinary(oldThumbnailCloudUrl);
  if (!deleteResponse) {
    throw new apiError(500, "Failed to delete thumbnail from Cloudinary");
  }
  const thumbnailCloudObj = await uploadOnCloudinary(thumbnailLocalObj.path);
  if (!thumbnailCloudObj) {
    throw new apiError(500, "Failed to upload thumbnail to Cloudinary");
  }
  const updatableFields = {
    title,
    description,
    thumbnail: thumbnailCloudObj.url
  };
  const updatedVideo = await Video.findByIdAndUpdate(videoId, updatableFields, {
    new: true
  });
  return res
    .status(200)
    .json(new apiResponse(200, updatedVideo, "Successfully updated video"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid video id");
  }
  const video = await Video.findByIdAndDelete(videoId);
  const videoCloudUrl = video.videoFile;
  const deleteRes = await deleteFromCloudinary(videoCloudUrl);
  if (!deleteRes) {
    throw new apiError(500, "Failed to delete video from Cloudinary");
  }
  return res
    .status(200)
    .json(new apiResponse(200, null, "Successfully deleted video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "No video found with the provided id");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(new apiResponse(200, video, "Successfully toggled publish status"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId;
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel id");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.mongo.ObjectId(channelId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $unwind: "$owner"
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: Number(limit)
    }
  ]);
  if (!videos) {
    throw new apiError(400, "No videos uploaded yet");
  }
  return res
    .status(200)
    .json(new apiResponse(200, videos, "Successfully sent videos"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getChannelVideos
};
