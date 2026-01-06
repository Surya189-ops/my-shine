import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

/* -------- SEND MESSAGE -------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { senderProfileId, receiverProfileId, text } = await req.json();

    if (
      !senderProfileId ||
      !receiverProfileId ||
      !text ||
      !mongoose.Types.ObjectId.isValid(senderProfileId) ||
      !mongoose.Types.ObjectId.isValid(receiverProfileId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    // ✅ REMOVED: Connection check - chat freely for now

    const message = await Message.create({
      senderProfileId: toObjectId(senderProfileId),
      receiverProfileId: toObjectId(receiverProfileId),
      text,
    });

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}

/* -------- FETCH MESSAGES -------- */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const myProfileId = searchParams.get("myProfileId");
    const otherProfileId = searchParams.get("otherProfileId");

    if (
      !myProfileId ||
      !otherProfileId ||
      !mongoose.Types.ObjectId.isValid(myProfileId) ||
      !mongoose.Types.ObjectId.isValid(otherProfileId)
    ) {
      return NextResponse.json(
        { success: false, messages: [] },
        { status: 200 }
      );
    }

    const messages = await Message.find({
      $or: [
        { 
          senderProfileId: toObjectId(myProfileId), 
          receiverProfileId: toObjectId(otherProfileId) 
        },
        { 
          senderProfileId: toObjectId(otherProfileId), 
          receiverProfileId: toObjectId(myProfileId) 
        },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (err) {
    console.error("FETCH MESSAGE ERROR:", err);
    return NextResponse.json(
      { success: false, messages: [] },
      { status: 200 }
    );
  }
}