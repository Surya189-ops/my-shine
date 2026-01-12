//app/api/notifications/payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PaymentNotification from "@/models/PaymentNotification";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId required" },
        { status: 400 }
      );
    }

    console.log("📥 Fetching payment notifications for:", profileId);

    // Get all pending payment notifications that haven't expired
    const notifications = await PaymentNotification.find({
      profileId,
      status: "pending",
      expiresAt: { $gt: new Date() }, // Only get non-expired notifications
    })
      .populate("fromProfileId", "name imageUrl tier")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} payment notifications`);

    // Automatically expire old notifications
    const expiredResult = await PaymentNotification.updateMany(
      {
        profileId,
        status: "pending",
        expiresAt: { $lte: new Date() }, // Expired
      },
      {
        $set: { status: "expired" },
      }
    );

    if (expiredResult.modifiedCount > 0) {
      console.log(`🧹 Expired ${expiredResult.modifiedCount} old notifications`);
    }

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error("Get payment notifications error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// DELETE a specific payment notification (when user clicks Pay)
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "notificationId required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Removing payment notification:", notificationId);

    // Mark as completed instead of deleting
    await PaymentNotification.findByIdAndUpdate(notificationId, {
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      message: "Notification removed",
    });
  } catch (error: any) {
    console.error("Delete payment notification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}

