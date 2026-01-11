// models/Message.ts - Updated with Image & View-Once Support
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
      trim: true,
      default: "", // Not required (can be empty if image-only message)
    },
    
    // -------- IMAGE FIELDS --------
    imageUrl: {
      type: String, // Base64 image data
      default: null,
    },
    imageWidth: {
      type: Number,
      default: null,
    },
    imageHeight: {
      type: Number,
      default: null,
    },
    
    // -------- VIEW ONCE FIELDS --------
    isViewOnce: {
      type: Boolean,
      default: false, // True if this is a view-once image
    },
    viewedBy: [{
      type: Schema.Types.ObjectId,
      ref: "Profile",
    }], // Array of profileIds who viewed this
    viewedAt: {
      type: Date, // When the receiver viewed it
      default: null,
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
      type: String,
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
      type: String, // "sender" | "receiver" | "both" | null
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