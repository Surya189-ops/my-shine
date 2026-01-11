// app/api/chat/mark-viewed/route.ts - Mark view-once image as viewed
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

/**
 * POST /api/chat/mark-viewed
 * Body: { messageId, profileId }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { messageId, profileId } = await req.json();

    console.log("👁️ Mark view-once as viewed:", { messageId, profileId });

    // Validation
    if (!messageId || !profileId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { success: false, message: "Invalid message ID" },
        { status: 400 }
      );
    }

    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    // Check if it's a view-once message
    if (!message.isViewOnce) {
      return NextResponse.json(
        { success: false, message: "Not a view-once message" },
        { status: 400 }
      );
    }

    // Check if already viewed
    const hasViewed = message.viewedBy?.some(
      (id: any) => id.toString() === profileId
    );

    if (hasViewed) {
      return NextResponse.json(
        { success: true, message: "Already viewed" },
        { status: 200 }
      );
    }

    // Mark as viewed
    message.viewedBy = message.viewedBy || [];
    message.viewedBy.push(new mongoose.Types.ObjectId(profileId));
    message.viewedAt = new Date();

    await message.save();

    console.log("✅ View-once image marked as viewed");

    // Calculate room ID for socket emission
    const roomId = [message.senderProfileId.toString(), message.receiverProfileId.toString()]
      .sort()
      .join("_");

    return NextResponse.json({
      success: true,
      socketData: {
        roomId,
        messageId: message._id.toString(),
        viewedBy: profileId,
        viewedAt: message.viewedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Mark viewed error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark as viewed" },
      { status: 500 }
    );
  }
}