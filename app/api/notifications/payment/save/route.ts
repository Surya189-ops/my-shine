// app/api/notifications/payment/save/route.ts - UPDATED TO 5 MINUTES
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PaymentNotification from "@/models/PaymentNotification";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { profileId, fromProfileId, requestId, fromName, fromImageUrl, tier } =
      await req.json();

    console.log("💾 Saving payment notification:", {
      profileId,
      fromProfileId,
      requestId,
      fromName,
      tier,
    });

    // Validation
    if (!profileId || !fromProfileId || !requestId || !fromName || !tier) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(profileId) ||
      !mongoose.Types.ObjectId.isValid(fromProfileId) ||
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid IDs" },
        { status: 400 }
      );
    }

    // Check if notification already exists
    const existing = await PaymentNotification.findOne({
      profileId,
      requestId,
      status: { $in: ["pending", "completed"] },
    });

    if (existing) {
      console.log("⚠️ Payment notification already exists, skipping save:", existing._id);
      return NextResponse.json({
        success: true,
        message: "Notification already exists",
        notification: existing,
      });
    }

    // ✅ Set expiry time to 5 minutes from now (changed from 20)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create payment notification
    const notification = await PaymentNotification.create({
      profileId,
      fromProfileId,
      requestId,
      fromName,
      fromImageUrl: fromImageUrl || "",
      tier,
      status: "pending",
      expiresAt,
    });

    console.log("✅ Payment notification saved (5 min expiry):", {
      id: notification._id,
      profileId,
      fromName,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Payment notification saved",
      notification,
    });
  } catch (error: any) {
    console.error("❌ Save payment notification error:", error);
    
    if (error.code === 11000) {
      console.log("⚠️ Duplicate key error - notification already exists");
      return NextResponse.json({
        success: true,
        message: "Notification already exists",
      });
    }
    
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save notification" },
      { status: 500 }
    );
  }
}