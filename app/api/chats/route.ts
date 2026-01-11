// app/api/chats/route.ts - Get list of all conversations
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const myProfileId = searchParams.get("profileId");

    if (!myProfileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(myProfileId)) {
      return NextResponse.json(
        { success: false, message: "Invalid profile ID" },
        { status: 400 }
      );
    }

    console.log("💬 Fetching chats for:", myProfileId);

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { senderProfileId: myProfileId },
        { receiverProfileId: myProfileId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group messages by conversation partner
    const chatMap = new Map<string, any>();

    for (const msg of messages) {
      const isSender = msg.senderProfileId.toString() === myProfileId;
      const otherProfileId = isSender
        ? msg.receiverProfileId.toString()
        : msg.senderProfileId.toString();

      // Only add to map if this is the first (most recent) message for this chat
      if (!chatMap.has(otherProfileId)) {
        // Count unread messages from this person
        const unreadCount = await Message.countDocuments({
          senderProfileId: otherProfileId,
          receiverProfileId: myProfileId,
          read: false,
          isDeleted: { $ne: true },
        });

        chatMap.set(otherProfileId, {
          profileId: otherProfileId,
          lastMessage: msg,
          unreadCount,
          lastMessageTime: msg.createdAt,
        });
      }
    }

    // Convert map to array
    const chatsArray = Array.from(chatMap.values());

    // Fetch profile details for each chat
    const chatsWithProfiles = await Promise.all(
      chatsArray.map(async (chat) => {
        const profile = await Profile.findById(chat.profileId)
          .select("name imageUrl gender tier country")
          .lean();

        if (!profile) {
          return null;
        }

        // Format last message preview
        let lastMessagePreview = "";
        const isSentByMe = chat.lastMessage.senderProfileId.toString() === myProfileId;

        if (chat.lastMessage.isDeleted) {
          lastMessagePreview = chat.lastMessage.deletedForEveryone
            ? "Message deleted"
            : isSentByMe
            ? "You deleted this message"
            : "This message was deleted";
        } else if (chat.lastMessage.imageUrl) {
          const viewOnceText = chat.lastMessage.isViewOnce ? "View-once photo" : "Photo";
          lastMessagePreview = isSentByMe ? `You: ${viewOnceText}` : viewOnceText;
        } else {
          const prefix = isSentByMe ? "You: " : "";
          lastMessagePreview = prefix + (chat.lastMessage.text || "");
        }

        return {
          profileId: chat.profileId,
          profile,
          lastMessage: lastMessagePreview,
          lastMessageTime: chat.lastMessageTime,
          unreadCount: chat.unreadCount,
          isLastMessageFromMe: isSentByMe,
        };
      })
    );

    // Filter out null values (profiles that don't exist)
    const validChats = chatsWithProfiles.filter((chat) => chat !== null);

    // Sort by most recent message first
    validChats.sort((a, b) => {
      return new Date(b!.lastMessageTime).getTime() - new Date(a!.lastMessageTime).getTime();
    });

    console.log(`✅ Found ${validChats.length} conversations`);

    return NextResponse.json({
      success: true,
      chats: validChats,
    });
  } catch (error: any) {
    console.error("❌ Fetch chats error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch chats" },
      { status: 500 }
    );
  }
}