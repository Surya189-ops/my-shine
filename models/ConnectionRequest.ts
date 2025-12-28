import mongoose, { Schema, models, model } from "mongoose";

const ConnectionRequestSchema = new Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
ConnectionRequestSchema.index({ fromUserId: 1, toProfileId: 1 });
ConnectionRequestSchema.index({ status: 1 });

const ConnectionRequest = 
  models.ConnectionRequest || 
  model("ConnectionRequest", ConnectionRequestSchema);

export default ConnectionRequest;