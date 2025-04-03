import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { View } from "../models/views.model.js";
import { isValidObjectId } from "mongoose";
export const increamentVideoViews = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }
  const viewerId = req.user._id;

  const existingView = await View.findOne({ video: videoId, viewer: viewerId });
  if (existingView) {
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          existingView,
          "Successfully found and returned video views"
        )
      );
  }
  const view = await View.create({
    video: videoId,
    viewer: viewerId
  });
  return res
    .status(200)
    .json(new apiResponse(200, view, "Successfully increamented video views"));
});

export const increamentTweetViews = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid video id");
  }
  const viewerId = req.user._id;

  const existingTweet = await View.findOne({
    tweet: tweetId,
    viewer: viewerId
  });
  if (existingTweet) {
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          existingTweet,
          "Successfully found and returned video views"
        )
      );
  }
  const view = await View.create({
    tweet: tweetId,
    viewer: viewerId
  });
  return res
    .status(200)
    .json(new apiResponse(200, view, "Successfully increamented video views"));
});
