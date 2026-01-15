
// FILE 3: app/api/notifications/mark-seen/route.ts - UPDATED

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId required" },
        { status: 400 }
      );
    }

    console.log("✅ Marking notifications as seen for:", profileId);

    // Mark all pending connection requests as seen
    await ConnectionRequest.updateMany(
      {
        toProfileId: profileId,
        status: "pending",
        seen: false,
      },
      {
        $set: { seen: true },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Notifications marked as seen",
    });
  } catch (error: any) {
    console.error("Mark seen error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark notifications" },
      { status: 500 }
    );
  }
}

