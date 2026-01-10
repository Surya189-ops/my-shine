// models/Message.ts - Updated with Edit/Delete support
import mongoose, { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    senderProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    receiverProfileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    
    // -------- EDIT FIELDS --------
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    originalText: {
      type: String, // Store original text before first edit
    },
    
    // -------- DELETE FIELDS --------
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: String, // "sender" | "both" | null
      default: null,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for fast chat queries
MessageSchema.index({ senderProfileId: 1, receiverProfileId: 1 });
MessageSchema.index({ createdAt: 1 });

const Message = models.Message || model("Message", MessageSchema);

export default Message;