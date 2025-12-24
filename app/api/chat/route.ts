import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { canUserChat } from "@/lib/canUserChat";

/* -------- SEND MESSAGE -------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { senderId, receiverId, text } = await req.json();

    // 🔐 AUTH GUARD
    if (!senderId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔎 REQUIRED FIELDS
    if (!receiverId || !text) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔐 PAYMENT CHECK
    const allowed = await canUserChat(senderId, receiverId);

    if (!allowed) {
      return NextResponse.json(
        { success: false, message: "Payment required to chat" },
        { status: 403 }
      );
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text,
    });

    return NextResponse.json({ success: true, message });
  } catch {
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
    const senderId = searchParams.get("senderId");
    const receiverId = searchParams.get("receiverId");

    // 🔐 AUTH GUARD
    if (!senderId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔎 REQUIRED PARAM
    if (!receiverId) {
      return NextResponse.json(
        { success: false, message: "receiverId is required" },
        { status: 400 }
      );
    }

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, messages });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load messages" },
      { status: 500 }
    );
  }
}
