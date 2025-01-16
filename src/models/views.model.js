import mongoose, { Schema } from "mongoose";
const viewsSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "video"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "tweet"
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "user"
    }
  },
  {
    timestamps: true
  }
);
export const View = mongoose.model("View", viewsSchema);
