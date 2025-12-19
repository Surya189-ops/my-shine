import mongoose, { Schema, models, model } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    bio: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    isCameraVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Profile = models.Profile || model("Profile", ProfileSchema);

export default Profile;
