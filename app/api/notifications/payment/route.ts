// FILE 2: app/api/notifications/payment/route.ts - UPDATED

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

    // First, delete expired payment notifications
    const deleteResult = await PaymentNotification.deleteMany({
      profileId,
      status: "pending",
      expiresAt: { $lte: new Date() },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${deleteResult.deletedCount} expired payment notifications`);
    }

    // Get all pending payment notifications that haven't expired
    const notifications = await PaymentNotification.find({
      profileId,
      status: "pending",
      expiresAt: { $gt: new Date() }, // Only get non-expired notifications
    })
      .populate("fromProfileId", "name imageUrl tier")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${notifications.length} active payment notifications`);

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

// DELETE a specific payment notification (when user clicks Pay or Dismiss)
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

    // Delete the notification
    await PaymentNotification.findByIdAndDelete(notificationId);

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

