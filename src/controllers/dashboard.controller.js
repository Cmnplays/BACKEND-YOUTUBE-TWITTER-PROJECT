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
  const totalChannelViews = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(channelId) }
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views"
        }
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]);
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
      $sort: {
        createdAt: 1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        subscriber: 1,
        _id: 0
      }
    }
  ]);
  const totalLikesNumber = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoOwner",
        pipeline: [
          {
            $project: {
              owner: 1,
              _id: 0
            }
          }
        ]
      }
    },
    {
      $unwind: "$videoOwner"
    },
    {
      $match: {
        "videoOwner.owner": new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $count: "totalLikes"
    },
    {
      $facet: {
        result: [{ $match: {} }],
        default: [{ $project: { totalLikes: { $literal: 0 } } }]
      }
    },
    {
      $project: {
        totalLikes: {
          $ifNull: [{ $arrayElemAt: ["$result.totalLikes", 0] }, 0]
          //i think in the below logic that method is working but here i had to use if null . i think because of i am unwinding docs here that logic was not working here
        }
      }
    }
  ]);
  const totalVideosNumber = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $count: "totalVideos"
    },
    {
      $facet: {
        result: [{ $match: {} }],
        default: [{ $project: { totalVideos: { $literal: 0 } } }]
      }
    },
    {
      $project: {
        totalVideos: {
          $arrayElemAt: [
            { $concatArrays: ["$result.totalVideos", "$default.totalVideos"] },
            0
          ]
        }
      }
    }
  ]);
  console.log({ totalVideosNumber, totalLikesNumber });
  let channelStats = {
    totalChannelViews: totalChannelViews[0].totalViews,
    totalVideos: totalVideosNumber[0].totalVideos,
    totalLikes: totalLikesNumber[0].totalLikes,
    subscribers
  };
  return res
    .status(200)
    .json(
      new apiResponse(200, channelStats, "Successfully sent channel statistics")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId;
  let { limit = 10, page = 1 } = req.body;
  if (
    isNaN(Number(limit)) ||
    isNaN(Number(page)) ||
    Number(limit) < 1 ||
    Number(page) < 1
  ) {
    limit = 10;
    page = 1;
  }

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

export { getChannelStats, getChannelVideos };
