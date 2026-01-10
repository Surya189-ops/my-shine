// app/api/chat/route.ts - Updated with block checks
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import BlockedUser from "@/models/BlockedUser";
import mongoose from "mongoose";

/**
 * POST /api/chat - Send a message (checks for blocks)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { senderProfileId, receiverProfileId, text } = await req.json();

    console.log("📨 Send message request:", {
      senderProfileId,
      receiverProfileId,
      text,
    });

    // Validation
    if (!senderProfileId || !receiverProfileId || !text) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(senderProfileId) ||
      !mongoose.Types.ObjectId.isValid(receiverProfileId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid profile ID (dummy profiles cannot chat)" },
        { status: 400 }
      );
    }

    // CHECK IF BLOCKED
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { blockerProfileId: senderProfileId, blockedProfileId: receiverProfileId },
        { blockerProfileId: receiverProfileId, blockedProfileId: senderProfileId },
      ],
    });

    if (isBlocked) {
      return NextResponse.json(
        { success: false, message: "Cannot send message to this user" },
        { status: 403 }
      );
    }

    // Create message
    const message = await Message.create({
      senderProfileId,
      receiverProfileId,
      text: text.trim(),
      delivered: false,
      read: false,
    });

    console.log("✅ Message created:", message);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("❌ Send message error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat - Get chat history (filters out blocked conversations)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const myProfileId = searchParams.get("myProfileId");
    const otherProfileId = searchParams.get("otherProfileId");

    console.log("📥 Fetch messages:", { myProfileId, otherProfileId });

    if (!myProfileId || !otherProfileId) {
      return NextResponse.json(
        { success: false, message: "myProfileId and otherProfileId required" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(myProfileId) ||
      !mongoose.Types.ObjectId.isValid(otherProfileId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid profile IDs" },
        { status: 400 }
      );
    }

    // CHECK IF BLOCKED
    const isBlocked = await BlockedUser.findOne({
      blockerProfileId: myProfileId,
      blockedProfileId: otherProfileId,
    });

    // If I blocked them, return empty messages
    if (isBlocked) {
      return NextResponse.json({
        success: true,
        messages: [],
      });
    }

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { senderProfileId: myProfileId, receiverProfileId: otherProfileId },
        { senderProfileId: otherProfileId, receiverProfileId: myProfileId },
      ],
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages`);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error("❌ Fetch messages error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}