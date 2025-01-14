import mongoose, { Schema } from "mongoose";
const viewsSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "video"
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
