import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
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

    // Count pending connection requests
    const connectionCount = await ConnectionRequest.countDocuments({
      toProfileId: profileId,
      status: "pending",
      seen: false,
    });

    // Count active payment notifications
    const paymentCount = await PaymentNotification.countDocuments({
      profileId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    const totalUnread = connectionCount + paymentCount;

    console.log(`🔔 Unread count for ${profileId}: ${totalUnread} (${connectionCount} connections, ${paymentCount} payments)`);

    return NextResponse.json({
      success: true,
      unreadCount: totalUnread,
      connectionCount,
      paymentCount,
    });
  } catch (error: any) {
    console.error("Get unread count error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get unread count" },
      { status: 500 }
    );
  }
}