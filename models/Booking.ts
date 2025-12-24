import mongoose, { Schema, models, model } from "mongoose";

const BookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // TEMPORARY: allows number (mock profiles) or ObjectId (real profiles later)
    profileId: {
      type: Schema.Types.Mixed,
      required: true,
    },

    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold"],
      required: true,
    },

    duration: {
      type: Number, // minutes
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "completed"],
      default: "pending",
    },

    // 🔐 NEW: chat validity window (NOT required to keep old data safe)
    startTime: {
      type: Date,
    },

    endTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;
