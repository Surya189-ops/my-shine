// app/api/notifications/payment/cleanup/route.ts
// This endpoint automatically expires old payment notifications
// Can be called by a cron job or manually

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PaymentNotification from "@/models/PaymentNotification";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Find all expired notifications that are still pending
    const result = await PaymentNotification.updateMany(
      {
        status: "pending",
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { status: "expired" },
      }
    );

    console.log(`🧹 Cleaned up ${result.modifiedCount} expired payment notifications`);

    return NextResponse.json({
      success: true,
      message: `Expired ${result.modifiedCount} notifications`,
      count: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Cleanup failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Same functionality for GET requests (easier for cron jobs)
  return POST(req);
}