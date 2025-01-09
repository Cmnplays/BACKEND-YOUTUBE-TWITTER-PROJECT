import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: userId
  })
  if(existingSubscription){
    const deletedSubscription = await Subscription.findByIdAndDelete(existingSubscription._id)
    if(!deletedSubscription){
      throw new apiError(500, "There was a problem while toggling subscription")
    }
    return res
    .status(200)
    .json(
       new apiResponse(200, null, "Successfully unsubscribed")
      )
 }
  const subscription = await Subscription.create({
    channel: channelId,
    subscriber: userId
  })

  if(!subscription){
    throw new apiError(500, "There was a problem while toggling subscription")
  }
  return res
  .status(200)
  .json(
     new apiResponse(200, subscription,"Successfully subscribed")
    )
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if(!isValidObjectId(channelId)){
    throw new apiError(400, "Invalid channel id")
  }
  const subscribers = await Subscription.countDocuments({channel: channelId})
  console.log(subscribers)
  return res 
  .status(200)
  .json(new apiResponse(200, {subscribers}, "Successfully sent subscribers")
  )
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if(!subscriberId || !isValidObjectId(subscriberId)){
    throw new apiError(400, "Invalid id")
  }
  const subscribedChannels = await Subscription.aggregate([{
    $match: {
      subscriber: new mongoose.Types.ObjectId(subscriberId)
    }
  },
  {
    $lookup:{
      from: "users",
      localField: "channel",
      foreignField: "_id",
      as: "channel",
      pipeline: [
        {
          $project: {
            username: 1,
            avatar: 1,
          }
        }
      ]
    }
  },
  {
    $project: {
      channel:1,
      subscriber: 1
    }
  }
]) 

if(!subscribedChannels === 0){
  return res.status(200).json(new apiResponse(200, subscribedChannels,"No channels subscribed yet!"))
}

return res.status(200).json(new apiResponse(200, subscribedChannels,"No channels subscribed yet!"))


});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
