import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;
  const { limit = 10, page = 1 } = req.body;
  const skip = (page - 1) * limit;
  //TODO: HERE I NEED TO FETCH AND SEND JUST THE TOTAL VIEWS OF VIDEOS NOT THE TOTAL VIDEOS
  const channelVideos = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(channelId) }
    },
    {
      $addFields: {
        totalViews: {
          $add: "$views"
        }
      }
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1
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
      $limit: limit
    }
  ]);
  console.log(channelVideos);
  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) }
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
              email: 1
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: "$subscriber",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber.user",
        foreignField: "_id",
        as: "subscirber"
      }
    },
    {
      $project: {
        subscriber: 1,
        _id: 0
      }
    }
  ]);
  console.log(subscribers);
  let channelStats = 2;
  return res
    .status(200)
    .json(
      new apiResponse(200, channelStats, "Successfully sent channel statistics")
    );
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId;
  const { limit = 10, page = 1 } = req.body;
  const skip = (page - 1) * limit;
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
      $limit: limit
    }
  ]);
  if (!videos) {
    throw new apiError(400, "No videos uploaded yet");
  }
  return res
    .status(200)
    .json(new apiResponse(200, videos, "Successfully sent videos"));
});

export { getChannelStats, getChannelVideos };
