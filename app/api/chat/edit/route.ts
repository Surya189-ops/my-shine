// app/api/chat/edit/route.ts - Edit message API
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

/**
 * POST /api/chat/edit
 * Body: { messageId, newText, profileId }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { messageId, newText, profileId } = await req.json();

    console.log("✏️ Edit message request:", { messageId, newText, profileId });

    // Validation
    if (!messageId || !newText || !profileId) {
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

    // Check ownership - only sender can edit
    if (message.senderProfileId.toString() !== profileId) {
      return NextResponse.json(
        { success: false, message: "You can only edit your own messages" },
        { status: 403 }
      );
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return NextResponse.json(
        { success: false, message: "Cannot edit a deleted message" },
        { status: 400 }
      );
    }

    // Check edit time limit (15 minutes like WhatsApp)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (messageAge > fifteenMinutes) {
      return NextResponse.json(
        { success: false, message: "Message can only be edited within 15 minutes" },
        { status: 400 }
      );
    }

    // Store original text if this is the first edit
    if (!message.isEdited) {
      message.originalText = message.text;
    }

    // Update message
    message.text = newText.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    console.log("✅ Message edited successfully");

    // Emit socket event (will be handled by socket server)
    const roomId = [message.senderProfileId.toString(), message.receiverProfileId.toString()]
      .sort()
      .join("_");

    // Return data for socket emission
    return NextResponse.json({
      success: true,
      message,
      socketData: {
        roomId,
        messageId: message._id.toString(),
        newText: message.text,
        isEdited: true,
        editedAt: message.editedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ Edit message error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to edit message" },
      { status: 500 }
    );
  }
}