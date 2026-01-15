import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID required" },
        { status: 400 }
      );
    }

    console.log("💬 Fetching unread conversation count for:", profileId);

    // Find all unique senders who have sent unread messages to this user
    const unreadSenders = await Message.distinct("senderProfileId", {
      receiverProfileId: profileId,
      read: false,
      isDeleted: { $ne: true },
    });

    const unreadConversationCount = unreadSenders.length;

    console.log(`📊 ${unreadConversationCount} people have sent unread messages`);

    return NextResponse.json({
      success: true,
      unreadConversationCount,
      unreadSenders, // Array of profileIds who sent unread messages
    });
  } catch (error: any) {
    console.error("❌ Get unread conversations error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to get unread count" },
      { status: 500 }
    );
  }
}