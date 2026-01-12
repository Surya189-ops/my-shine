// models/PaymentNotification.ts
import mongoose, { Schema, models, model } from "mongoose";

const PaymentNotificationSchema = new Schema(
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
    fromName: {
      type: String,
      required: true,
    },
    fromImageUrl: {
      type: String,
      default: "",
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Index for efficient cleanup queries
    },
  },
  { timestamps: true }
);

// Index for automatic expiry cleanup
PaymentNotificationSchema.index({ expiresAt: 1, status: 1 });

const PaymentNotification =
  models.PaymentNotification ||
  model("PaymentNotification", PaymentNotificationSchema);

export default PaymentNotification;