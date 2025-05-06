import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handlePaginationParams } from "../utils/handlePaginationParams.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
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

export { getChannelStats };
