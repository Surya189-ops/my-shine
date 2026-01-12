// models/DeclinedNotification.ts - NEW MODEL
import mongoose, { Schema, models, model } from "mongoose";

const DeclinedNotificationSchema = new Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    fromProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectionRequest",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "viewed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const DeclinedNotification =
  models.DeclinedNotification ||
  model("DeclinedNotification", DeclinedNotificationSchema);

export default DeclinedNotification;