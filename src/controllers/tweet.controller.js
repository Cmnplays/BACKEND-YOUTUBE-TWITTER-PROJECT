import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handlePaginationParams } from "../utils/handlePaginationParams.js";

const createTweet = asyncHandler(async (req, res) => {
  const content = req.body.content;
  if (!content) {
    throw new apiError(400, "Content is required");
  }
  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id");
  }
  const createdTweet = await Tweet.create({
    content,
    owner: userId
  });

  if (!createdTweet) {
    throw new apiError(500, "There was a problem while creating tweet");
  }
  const aggregatedTweet = await Tweet.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$_id", { $toObjectId: createdTweet._id }]
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
      $unwind: {
        path: "$owner"
      }
    }
  ]);
  if (!aggregatedTweet) {
    throw new apiError(500, "There was a problem while creating tweet");
  }

  return res
    .status(201)
    .json(new apiResponse(201, aggregatedTweet, "Successfully created tweet"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  const tweets = await Tweet.aggregate([
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
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "tweet",
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
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
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

  if (tweets.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "No tweets posted yet"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "Successfully fetched all tweets"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id");
  }
  let { page = 1, limit = 10 } = req.body;
  const skip = (page - 1) * limit;
  const tweets = await Tweet.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$owner", { $toObjectId: userId }]
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
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "tweet",
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
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
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

  if (tweets.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "No tweets posted yet"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "Successfully fetched all tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  const newContent = req.body.newContent;
  if (!tweetId?.trim() || !newContent?.trim()) {
    throw new apiError("Invalid tweet id or invalid new content");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content: newContent },
    { new: true }
  );
  if (!updatedTweet) {
    throw new apiError(400, "No comment found with the provided id");
  }
  const aggregatedTweet = await Tweet.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$_id", { $toObjectId: updatedTweet._id }]
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
      $unwind: {
        path: "$owner"
      }
    },
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "tweet",
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
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes"
      }
    },
    {
      $addFields: {
        likes: {
          $size: "$likes"
        }
      }
    }
  ]);

  if (!aggregatedTweet) {
    throw new apiError(500, "There was a problem while updating tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, aggregatedTweet, "Successfully updated tweet"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    throw new apiError(400, "There was a problem while deleting the tweet");
  }
  return res
    .status(200)
    .json(new apiResponse(200, null, "Successfully deleted tweet"));
});

export { createTweet, getAllTweets, getUserTweets, updateTweet, deleteTweet };
