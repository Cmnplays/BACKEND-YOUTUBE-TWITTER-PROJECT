import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { View } from "../models/views.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { handlePaginationParams } from "../utils/handlePaginationParams.js";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, error.message);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  //   if (!username || !email || !fullName || !password) {
  //     throw new apiError(400, "All fields are required")
  //     }

  //* below is given a better approach for that same thing

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  //* checking format of the email using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new apiError(422, "please enter a valid email address");
  }
  //* checking format of the passwprd using regex
  // const passwordRegex= /^[a-zA-Z0-9]+$/;
  // if(!passwordRegex.test(password)){
  //     throw new apiError(422, "please use a alphanumeric password ")
  // }

  //* checking if the user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    throw new apiError(409, "User with email or username already exists");
  }
  // const avatarLocalPath = req.files?.avatar[0]?.path;
  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar image is required");
  }

  const avatarCloudinaryPath = await uploadOnCloudinary(avatarLocalPath);
  const coverImageCloudinaryPath =
    await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarCloudinaryPath) {
    throw new apiError(400, "Avatar field is required");
  }

  //*creating user
  const user = await User.create({
    fullName,
    avatar: avatarCloudinaryPath.url,
    coverImage: coverImageCloudinaryPath?.url,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Error while registering user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        201,
        { user: createdUser, accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new apiError(400, "Username or email is missing");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new apiError(401, "Invalid user credentails");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; //for mobile app

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }
  try {
    const decodedTokenInfo = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedTokenInfo?._id);

    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
      user._id
    );
    if (!accessToken || !refreshToken) {
      throw new apiError(
        "There was a problem while generating access token or refresh token"
      );
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new apiError(401, error?.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPass, newPass, confirmPass } = req.body;
  if (confirmPass) {
    if (newPass !== confirmPass) {
      throw new apiError(401, "Confirm password is not equal to new password");
    }
  }
  const user = await User.findById(req.user?._id);
  const passwordStatus = await user.isPasswordCorrect(oldPass);
  if (!passwordStatus) {
    throw new apiError(401, "Unauthorized request");
  }
  user.password = newPass;
  await user.save({ validateBeforeSave: true });
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Successfully changed old password"));
});

const getCurrentUser = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body;
  if (!(fullName || username || email)) {
    throw new apiError(400, "Any one field is required");
  }
  let data = {};
  if (fullName) data.fullName = fullName;
  if (username) data.username = username;
  if (email) data.email = email;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: data
    },
    {
      new: true
    }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file missing");
  }
  const user = await User.findById(req.user._id);
  const oldCloudinaryAvatarPath = user.avatar;
  const deleteAvatarRes = await deleteFromCloudinary(oldCloudinaryAvatarPath);
  if (!deleteAvatarRes) {
    throw new apiError(500, "Unable to delete avatar from cloudinary");
  }
  const avatarCloudinaryPath = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarCloudinaryPath) {
    throw new apiError(500, "Error while uploading avatar on cloudinary");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarCloudinaryPath.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Successfully updated avatar"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file.path;
  if (!coverImageLocalPath) {
    throw new apiError(400, "coverImage file missing");
  }

  const user = await User.findById(req.user._id);
  const oldCloudinaryCoverImagePath = user.avatar;
  const deleteCoverImageRes = await deleteFromCloudinary(
    oldCloudinaryCoverImagePath
  );
  if (!deleteCoverImageRes) {
    throw new apiError(500, " Unable to delete avatar from cloudinary");
  }
  const coverImageCloudinaryPath =
    await uploadOnCloudinary(coverImageLocalPath);
  console.log(coverImageCloudinaryPath);

  if (!coverImageCloudinaryPath) {
    throw new apiError(500, "Error while uploading avatar on cloudinary");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImageCloudinaryPath.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Successfully updated coverImage"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new apiError(400, "Username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        subscribersCount: 1,
        channelIsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1
      }
    }
  ]);

  if (!channel?.length) {
    throw new apiError(404, "Channel does not exist.");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let { limit, page } = req.query;
  let skip;
  ({ limit, page, skip } = handlePaginationParams(limit, page));
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user id");
  }
  const watchHistory = await View.aggregate([
    [
      {
        $match: { viewer: new mongoose.Types.ObjectId(userId) }
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
                      avatar: 1,
                      username: 1
                    }
                  }
                ]
              }
            },
            {
              $lookup: {
                from: "views",
                localField: "_id",
                foreignField: "video",
                as: "views"
              }
            },
            {
              $addFields: {
                views: { $size: "$views" }
              }
            },
            {
              $project: {
                thumbnail: 1,
                title: 1,
                duration: 1,
                owner: 1,
                views: 1
              }
            },
            {
              $unwind: "$owner"
            }
          ]
        }
      },
      {
        $unwind: "$video"
      },
      {
        $project: {
          video: 1,
          _id: 0
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $replaceRoot: {
          newRoot: "$video"
        }
      }
      // {
      //   $project: {
      //     watchHistory: 1,
      //     _id: 1
      //   }
      // }
    ]
  ]);
  //*THIS BELOW LOGIC IS SUITABLE WHEN WE JUST PUSH THE VIDEO ID IN WATCHHISTORY IF WATCHED BY THE USER. BUT IN THIS CASE WHEN THE USER WILL HAVE WATCHED ALOT OF VIDEOS, THEN THE ARRAY MIGHT BE VERY BIG.
  // const user = await User.aggregate([
  //   {
  //     $match: {
  //       $expr: {
  //         $eq: ["$_id", { $toObjectId: userId }]
  //       }
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "videos",
  //       localField: "watchHistory",
  //       foreignField: "_id",
  //       as: "watchHistory",
  //       pipeline: [
  //         {
  //           $lookup: {
  //             from: "users",
  //             localField: "owner",
  //             foreignField: "_id",
  //             as: "owner",
  //             pipeline: [
  //               {
  //                 $project: {
  //                   fullName: 1,
  //                   username: 1,
  //                   avatar: 1
  //                 }
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           $addFields: {
  //             owner: {
  //               $first: "$owner"
  //             }
  //           }
  //         }
  //       ]
  //     }
  //   }
  // ]);
  if (!watchHistory) {
    throw new apiError(500, "Error while getting watchHistory");
  }
  return res
    .status(200)
    .json(
      new apiResponse(200, watchHistory, "Successfully sent watch history")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateCoverImage,
  updateAvatar,
  getUserChannelProfile,
  getWatchHistory
};
