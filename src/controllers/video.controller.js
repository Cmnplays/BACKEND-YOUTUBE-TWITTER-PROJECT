import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query = "",
    sortBy,
    sortType,
    userId
  } = req.query;

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
  const skip = (page - 1) * limit;
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
    }
  ]);

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
