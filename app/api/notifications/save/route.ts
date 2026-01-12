// app/api/notifications/save/route.ts
// This API saves payment notifications that timeout to the notification center
// OPTIONAL: Only needed if you want payment timeouts to appear in /notifications

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

// You can create a PaymentNotification model if needed, or reuse ConnectionRequest
// For now, we'll just acknowledge the save request

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { profileId, type, fromProfileId, requestId } = await req.json();

    // Validation
    if (!profileId || !type || !fromProfileId || !requestId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Create a PaymentNotification model and save to DB
    // For now, just log it
    console.log("💾 Saving payment notification:", {
      profileId,
      type,
      fromProfileId,
      requestId,
      timestamp: new Date().toISOString(),
    });

    /* 
    FUTURE IMPLEMENTATION:
    
    const notification = await PaymentNotification.create({
      profileId,
      type,
      fromProfileId,
      requestId,
      status: "pending",
      createdAt: new Date(),
    });
    */

    return NextResponse.json({
      success: true,
      message: "Notification saved",
    });
  } catch (err: any) {
    console.error("Save notification error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to save notification" },
      { status: 500 }
    );
  }
}

/*
OPTIONAL: Create PaymentNotification Model
==========================================

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
    type: {
      type: String,
      enum: ["payment_pending"],
      default: "payment_pending",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const PaymentNotification =
  models.PaymentNotification ||
  model("PaymentNotification", PaymentNotificationSchema);

export default PaymentNotification;
*/