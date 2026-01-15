// models/ConnectionRequest.ts - Updated with "seen" field
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConnectionRequest extends Document {
  fromProfileId: mongoose.Types.ObjectId;
  toProfileId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  seen: boolean; // NEW: Track if notification has been seen
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>(
  {
    fromProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    toProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    seen: {
      type: Boolean,
      default: false, // NEW: Default to false (unseen)
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate requests
ConnectionRequestSchema.index(
  { fromProfileId: 1, toProfileId: 1 },
  { unique: true }
);

// Index for faster queries
ConnectionRequestSchema.index({ toProfileId: 1, status: 1, seen: 1 });

const ConnectionRequest: Model<IConnectionRequest> =
  mongoose.models.ConnectionRequest ||
  mongoose.model<IConnectionRequest>("ConnectionRequest", ConnectionRequestSchema);

export default ConnectionRequest;