// app/api/connections/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import Profile from "@/models/Profile";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        { success: false, message: "Valid profileId required" },
        { status: 400 }
      );
    }

    const profileObjectId = new mongoose.Types.ObjectId(profileId);

    // Find all accepted connections (both sent and received)
    const acceptedConnections = await ConnectionRequest.find({
      $or: [
        { fromProfileId: profileObjectId, status: "accepted" },
        { toProfileId: profileObjectId, status: "accepted" },
      ],
    }).lean();

    // Extract connected profile IDs
    const connectedProfileIds = acceptedConnections.map((conn) => {
      if (conn.fromProfileId.toString() === profileId) {
        return conn.toProfileId;
      }
      return conn.fromProfileId;
    });

    if (connectedProfileIds.length === 0) {
      return NextResponse.json({
        success: true,
        connections: [],
      });
    }

    // Fetch profiles of connected users
    const connectedProfiles = await Profile.find({
      _id: { $in: connectedProfileIds },
    })
      .select("name age gender tier imageUrl")
      .lean();

    // For each connection, get the last message
    const connectionsWithMessages = await Promise.all(
      connectedProfiles.map(async (profile) => {
        const otherProfileId = profile._id;

        // Get last message between current user and this connection
        const lastMessage = await Message.findOne({
          $or: [
            {
              senderProfileId: profileObjectId,
              receiverProfileId: otherProfileId,
            },
            {
              senderProfileId: otherProfileId,
              receiverProfileId: profileObjectId,
            },
          ],
        })
          .sort({ createdAt: -1 })
          .select("text createdAt senderProfileId")
          .lean();

        // Count unread messages from this connection
        const unreadCount = await Message.countDocuments({
          senderProfileId: otherProfileId,
          receiverProfileId: profileObjectId,
          read: false,
        });

        return {
          _id: profile._id,
          profile,
          lastMessage: lastMessage || undefined,
          unreadCount,
        };
      })
    );

    // Sort by last message time (most recent first)
    connectionsWithMessages.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    return NextResponse.json({
      success: true,
      connections: connectionsWithMessages,
    });
  } catch (error: any) {
    console.error("Connections fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}