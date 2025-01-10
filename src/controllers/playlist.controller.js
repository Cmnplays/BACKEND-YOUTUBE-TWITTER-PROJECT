import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name.trim() || !description.trim()) {
    throw new apiError(400, "Name and description are required");
  }
  const existingPlaylist = await Playlist.findOne({
    name
  });
  if (existingPlaylist) {
    //if plaulist exists set name to name +1 or 2 or the required number
  }
  const playlist = await Playlist.create({
    name,
    description,
    videos: [],
    owner: req.user._id
  });

  if (!playlist) {
    throw new apiError(500, "There was a problem while creating playlist");
  }

  return res
    .status(201)
    .json(new apiResponse(201, playlist, "Successfully created playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $addFields: {
        numberOfVideos: {
          $size: "$videos"
        }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        numberOfVideos: 1,
        owner: 1
      }
    }
  ]);
  if (!playlist) {
    throw new apiError(500, "There was a problem while creating playlist");
  }
  if (playlist.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, playlist, "No playlist created yet"));
  }
  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Successfully found playlist"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(400, "Playlist id is required");
  }
  const playlist = await Playlist.aggregate([
    [
      {
        $match: {
          $expr: {
            $eq: ["$owner", { $toObjectId: playlistId }]
          }
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
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
                      avatar: 1,
                      email: 1
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
              $project: {
                thumbnail: 1,
                owner: 1,
                duration: 1,
                title: 1,
                views: 1
              }
            }
          ]
        }
      }
    ]
  ]);
  if (!playlist) {
    throw new apiError("Playlist doesn't exists");
  }
  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Successfully sent playlist"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Valid playlist id and video id is required");
  }
  const existingVideoInPlaylist = await Playlist.aggregate([
    {
      $match: {
        videos: {
          $in: [new mongoose.Types.ObjectId(videoId)]
        }
      }
    }
  ]);
  if (existingVideoInPlaylist) {
    throw new apiError(400, "Video already exists in playlist");
  }
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId }
    },
    {
      new: true
    }
  );

  if (!playlist) {
    throw new api(500, "There was a problem while adding video to playlist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, playlist, "Successfully added video to playlist")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};
