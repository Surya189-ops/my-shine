// app/api/chat/route.ts - Updated with Image Support
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

/**
 * POST /api/chat - Send a message (text and/or image)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { 
      senderProfileId, 
      receiverProfileId, 
      text, 
      imageUrl, 
      imageWidth, 
      imageHeight,
      isViewOnce 
    } = await req.json();

    console.log("📨 Send message request:", {
      senderProfileId,
      receiverProfileId,
      hasText: !!text,
      hasImage: !!imageUrl,
      isViewOnce: !!isViewOnce,
    });

    // Validation
    if (!senderProfileId || !receiverProfileId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // At least text or image must be present
    if (!text && !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Message must have either text or image" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(senderProfileId) ||
      !mongoose.Types.ObjectId.isValid(receiverProfileId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid profile ID" },
        { status: 400 }
      );
    }

    // Create message
    const messageData: any = {
      senderProfileId,
      receiverProfileId,
      delivered: false,
      read: false,
    };

    // Add text if present
    if (text) {
      messageData.text = text.trim();
    }

    // Add image if present
    if (imageUrl) {
      messageData.imageUrl = imageUrl;
      messageData.imageWidth = imageWidth || null;
      messageData.imageHeight = imageHeight || null;
      messageData.isViewOnce = isViewOnce || false;
    }

    const message = await Message.create(messageData) as any;

    console.log("✅ Message created:", message._id);

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
 * GET /api/chat - Get chat history
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

    // Fetch messages
    const messages = await Message.find({
      $or: [
        { senderProfileId: myProfileId, receiverProfileId: otherProfileId },
        { senderProfileId: otherProfileId, receiverProfileId: myProfileId },
      ],
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages`);

    // Process view-once images for the receiver
    const processedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
      
      // If it's a view-once image
      if (msgObj.isViewOnce && msgObj.imageUrl) {
        const isReceiver = msgObj.receiverProfileId.toString() === myProfileId;
        const hasViewed = msgObj.viewedBy?.some(
          (id: any) => id.toString() === myProfileId
        );
        
        // Hide image URL if receiver has already viewed it
        if (isReceiver && hasViewed) {
          msgObj.imageUrl = null; // Clear the image
          msgObj.text = ""; // Clear any text too
        }
      }
      
      return msgObj;
    });

    return NextResponse.json({
      success: true,
      messages: processedMessages,
    });
  } catch (error: any) {
    console.error("❌ Fetch messages error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}