

import mongoose, { Schema, models, model } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold"],
    },
    country: {
      type: String,
      enum: [
        "korea",
        "japan",
        "brazil",
        "france",
        "spain",
        "usa",
        "colombia",
        "venezuela",
        "argentina",
      ],
      index: true,
    },
    isCameraVerified: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Profile = models.Profile || model("Profile", ProfileSchema);
export default Profile;
