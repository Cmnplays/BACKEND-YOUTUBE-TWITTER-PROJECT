import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  if (!videoId || !isValidObjectId(videoId)) {
    throw apiError(400, "videoId is required");
  }
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
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
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $sort: {
        createdAt: -1
      }
    }
  ]);
  if (comments.length === 0) {
    return res
      .status(200)
      .json(apiResponse(200, comments, "There are no comments on this video"));
  }

  return res
    .status(200)
    .json(apiResponse(200, comments, "Successfully fetched comments"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  const { content } = req.body;
  if (!content) {
    throw apiError(400, "content is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw apiError(404, "Video not found");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId
  });
  if (!comment) {
    throw apiError(500, "Failed to add comment");
  }
  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { newContent } = req.body;
  if (!newContent) {
    throw apiError(400, "newContent is required");
  }
  const commentId = req.params.commentId;
  if (!commentId || !isValidObjectId(commentId)) {
    throw apiError(400, "Invalid commentId");
  }
  const comment = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(commentId)
      }
    },
    {
      $set: {
        content: newContent
      }
    },
    {
      $new: true
    }
  ]);

  if (!comment) {
    throw new apiError(500, "There was a problem while updating the comment");
  }
  return res
    .status(200)
    .json(new apiResponse(200, comment, "Successfully updated comment"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const commentId = req.params.commentId;
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    throw new apiError(400, "There was a problem while deleting comment");
  }
  return res
    .status(200)
    .json(new apiResponse(200, null, "Successfully deleted comment"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
