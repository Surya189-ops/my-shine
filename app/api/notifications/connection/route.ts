
// app/api/notifications/connection/route.ts - NEW FILE

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

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

    console.log("📥 Fetching connection notifications for:", profileId);

    // Calculate 7 minutes ago
    const sevenMinutesAgo = new Date(Date.now() - 7 * 60 * 1000);

    // First, delete expired connection requests (older than 7 minutes)
    const deleteResult = await ConnectionRequest.deleteMany({
      toProfileId: profileId,
      status: "pending",
      createdAt: { $lte: sevenMinutesAgo },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${deleteResult.deletedCount} expired connection requests (>7 mins)`);
    }

    // Get all pending connection requests (within 7 minutes)
    const requests = await ConnectionRequest.find({
      toProfileId: profileId,
      status: "pending",
      createdAt: { $gt: sevenMinutesAgo }, // Only get requests from last 7 minutes
    })
      .populate("fromProfileId", "name imageUrl age gender tier")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${requests.length} active connection requests`);

    // Format the response
    const notifications = requests.map((req) => {
      const from = req.fromProfileId as any;
      return {
        _id: req._id.toString(),
        fromProfile: from ? {
          _id: from._id.toString(),
          name: from.name,
          imageUrl: from.imageUrl,
          age: from.age,
          gender: from.gender,
          tier: from.tier,
        } : null,
        requestId: req._id.toString(),
        createdAt: req.createdAt,
        expiresAt: new Date(req.createdAt.getTime() + 7 * 60 * 1000),
      };
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.filter(n => n.fromProfile !== null),
    });
  } catch (error: any) {
    console.error("Get connection notifications error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get notifications" },
      { status: 500 }
    );
  }
}

