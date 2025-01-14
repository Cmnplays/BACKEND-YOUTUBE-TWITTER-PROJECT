import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { View } from "../models/views.model.js";
import { isValidObjectId } from "mongoose";
export const increamentViews = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }
  const existingView = await View.findOne({ video: videoId });
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
  const viewerId = req.user._id;
  const view = await View.create({
    video: videoId,
    viewer: viewerId
  });
  return res
    .status(200)
    .json(new apiResponse(200, view, "Successfully increamented video views"));
});
