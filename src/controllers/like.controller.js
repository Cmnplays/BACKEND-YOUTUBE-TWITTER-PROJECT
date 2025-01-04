import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video ID is required");
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
  if (!commentId) {
    throw new apiError(400, "Tweet ID is required");
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
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
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
                    avatar: 1,
                    username: 1
                  }
                },
                {
                  $addFields: {
                    owner: {
                      $arrayElemAt: ["$owner", 0]
                    }
                  }
                }
              ]
            }
          },
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        likedVideos: 1
      }
    },
    {
      $addFields: {
        likedVideos: {
          $arrayElemAt: ["$likedVideos", 0] // (i cannot write dollar here)first: "$likedVideos"
        }
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

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
