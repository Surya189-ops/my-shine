// app/api/chat/delete/route.ts - Delete message API
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

/**
 * POST /api/chat/delete
 * Body: { messageId, profileId, deleteForEveryone }
 * 
 * deleteForEveryone: true = Delete for both users (only within 7 minutes)
 * deleteForEveryone: false = Delete for me only
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { messageId, profileId, deleteForEveryone } = await req.json();

    console.log("🗑️ Delete message request:", { messageId, profileId, deleteForEveryone });

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

    const isSender = message.senderProfileId.toString() === profileId;
    const isReceiver = message.receiverProfileId.toString() === profileId;

    if (!isSender && !isReceiver) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to delete this message" },
        { status: 403 }
      );
    }

    // DELETE FOR EVERYONE (only sender can do this, within 7 minutes)
    if (deleteForEveryone) {
      if (!isSender) {
        return NextResponse.json(
          { success: false, message: "Only sender can delete for everyone" },
          { status: 403 }
        );
      }

      // Check time limit (7 minutes like WhatsApp)
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const sevenMinutes = 7 * 60 * 1000;

      if (messageAge > sevenMinutes) {
        return NextResponse.json(
          { success: false, message: "Messages can only be deleted for everyone within 7 minutes" },
          { status: 400 }
        );
      }

      // Mark as deleted for everyone
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = "both";
      message.deletedForEveryone = true;
      // Don't clear text - keep it in DB but don't show in UI

      await message.save();

      console.log("✅ Message deleted for everyone");

      const roomId = [message.senderProfileId.toString(), message.receiverProfileId.toString()]
        .sort()
        .join("_");

      return NextResponse.json({
        success: true,
        deletedForEveryone: true,
        socketData: {
          roomId,
          messageId: message._id.toString(),
          isDeleted: true,
          deletedForEveryone: true,
        },
      });
    }

    // DELETE FOR ME ONLY
    else {
      // If already deleted for everyone, can't delete for me
      if (message.deletedForEveryone) {
        return NextResponse.json(
          { success: false, message: "Message already deleted" },
          { status: 400 }
        );
      }

      // Mark who deleted it
      if (isSender) {
        message.deletedBy = message.deletedBy === "receiver" ? "both" : "sender";
      } else {
        message.deletedBy = message.deletedBy === "sender" ? "both" : "receiver";
      }

      // If both deleted, mark as fully deleted
      if (message.deletedBy === "both") {
        message.isDeleted = true;
        message.deletedAt = new Date();
        // Keep text in DB for data integrity
      }

      await message.save();

      console.log("✅ Message deleted for user:", profileId);

      return NextResponse.json({
        success: true,
        deletedForEveryone: false,
        deletedBy: message.deletedBy,
      });
    }
  } catch (error: any) {
    console.error("❌ Delete message error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete message" },
      { status: 500 }
    );
  }
}