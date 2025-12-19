import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
