import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { apiResponse } from "../utils/apiResponse.js";
export const increamentViews = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );
  return res
    .status(200)
    .json(new apiResponse(200, video, "Successfully increamented video views"));
});
