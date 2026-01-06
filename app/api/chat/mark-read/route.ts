import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { messageIds, myProfileId } = await req.json();

    if (!messageIds || !Array.isArray(messageIds) || !myProfileId) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    // Mark messages as read only if I'm the receiver
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiverProfileId: new mongoose.Types.ObjectId(myProfileId),
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to mark as read" },
      { status: 500 }
    );
  }
}