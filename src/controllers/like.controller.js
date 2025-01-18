import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweets.model.js";
import { handlePaginationParams } from "../utils/handlePaginationParams.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video ID is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  const userId = req.user._id;
  let like = await Like.findOne({
    video: videoId,
    likedBy: userId
  });
  if (like) {
    await Like.deleteOne({
      video: videoId,
      likedBy: userId
    });
    return res
      .status(200)
      .json(new apiResponse(200, null, "Successfully toggled like"));
  } else {
    like = await Like.create({
      video: videoId,
      likedBy: userId
    });
  }
  return res
    .status(200)
    .json(new apiResponse(200, like, "Successfully toggled like in video"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new apiError(400, "Comment ID is required");
  }
  const userId = req.user._id;
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }
  let like = await Like.findOne({
    comment: commentId,
    likedBy: userId
  });
  if (like) {
    await Like.deleteOne({
      comment: commentId,
      likedBy: userId
    });
    return res
      .status(200)
      .json(new apiResponse(200, null, "Successfully toggled like in comment"));
  } else {
    like = await Like.create({
      comment: commentId,
      likedBy: userId
    });
  }
  return res
    .status(200)
    .json(new apiResponse(200, like, "Successfully toggled like in comment"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new apiError(400, "Tweet ID is required");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "Video not found");
  }
  const userId = req.user._id;
  let like = await Like.findOne({
    tweet: tweetId,
    likedBy: userId
  });
  if (like) {
    await Like.deleteOne({
      tweet: tweetId,
      likedBy: userId
    });
    return res
      .status(200)
      .json(new apiResponse(200, null, "Successfully toggled like in tweet "));
  } else {
    like = await Like.create({
      tweet: tweetId,
      likedBy: userId
    });
  }
  return res
    .status(200)
    .json(new apiResponse(200, like, "Successfully toggled like in tweet"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID");
  }
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  const likedVideos = await Like.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$likedBy", { $toObjectId: userId }]
        }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
                    coverImage: 1
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
              title: 1,
              thumbnail: 1,
              duration: 1,
              owner: 1
            }
          }
        ]
      }
    },
    {
      $unwind: "$video"
    },
    {
      $project: {
        _id: 0,
        likedBy: 0
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $group: {
        _id: "$likedBy",
        likedVideos: {
          $push: "$$ROOT"
        }
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]);
  if (!likedVideos || likedVideos.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, [], "No liked videos found"));
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, likedVideos, "Liked videos successfully returned")
    );
});

const getLikedTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log(userId);
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID");
  }
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  const likedTweets = await Like.aggregate([
    {
      $match: {
        $expr: {
          $eq: ["$likedBy", { $toObjectId: userId }]
        }
      }
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweet",
        pipeline: [
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
                    coverImage: 1
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
              content: 1
            }
          }
        ]
      }
    },
    {
      $unwind: "$tweet"
    },
    {
      $project: {
        _id: 0,
        likedBy: 0
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $group: {
        _id: "$likedBy",
        likedTweets: {
          $push: "$$ROOT"
        }
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]);
  if (!likedTweets || likedTweets.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, [], "No liked videos found"));
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, likedTweets, "Liked videos successfully returned")
    );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedTweets
};
