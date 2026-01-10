// models/BlockedUser.ts
import mongoose, { Schema, models, model } from "mongoose";

const BlockedUserSchema = new Schema(
  {
    blockerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    blockedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate blocks and enable fast lookups
BlockedUserSchema.index({ blockerProfileId: 1, blockedProfileId: 1 }, { unique: true });

const BlockedUser = models.BlockedUser || model("BlockedUser", BlockedUserSchema);

export default BlockedUser;