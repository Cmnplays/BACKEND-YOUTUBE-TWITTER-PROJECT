import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

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
              avatar: 1,
              username: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        content: 1,
        owner: 1,
        video: 1
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
      .json(
        new apiResponse(200, comments, "There are no comments on this video")
      );
  }

  return res
    .status(200)
    .json(new apiResponse(200, comments, "Successfully fetched comments"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "content is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (!isValidObjectId(videoId)) {
    throw new apiError("Invalid video id");
  }
  const createdComment = await Comment.create({
    content,
    video: videoId,
    owner: userId
  });
  if (!createdComment) {
    throw new apiError(500, "Failed to add comment");
  }
  const aggregatedComment = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(createdComment._id)
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
    }
  ]);
  if (!aggregatedComment) {
    throw new apiError(500, "Failed to aggregate comment");
  }
  return res
    .status(201)
    .json(
      new apiResponse(201, aggregatedComment, "Comment added successfully")
    );
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
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: newContent
    },
    {
      new: true
    }
  );

  if (!updatedComment) {
    throw new apiError(404, "Comment not found or could not be updated");
  }

  const aggregatedComment = await Comment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(updatedComment._id)
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
    }
  ]);

  if (!aggregatedComment) {
    throw new apiError(
      500,
      "There was a problem while aggregating the comment"
    );
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, aggregatedComment, "Successfully updated comment")
    );
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
