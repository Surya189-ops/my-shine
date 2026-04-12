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
    country: {
      type: String,
      enum: [
        "korea",
        "japan",
        "brazil",
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
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    verificationPhoto: {
      type: String,
      default: "",
    },
    verificationPhone: {
      type: String,
      default: "",
    },
    isOnHomepage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Profile = models.Profile || model("Profile", ProfileSchema);
export default Profile;