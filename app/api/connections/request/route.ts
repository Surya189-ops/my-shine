// app/api/connections/request/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

// Helper to check if ID is a valid MongoDB ObjectId (24-char hex string)
const isValidObjectId = (id: string) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;
};

// Helper to get Socket.IO instance
const getIO = () => {
  if (global.io) {
    return global.io;
  }
  return null;
};

export async function POST(req: Request) {
  try {
    console.log("▶️ Connection request API hit");

    await connectDB();
    console.log("✅ DB connected");

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { fromProfileId, toProfileId } = body;

    // Validate required fields
    if (!fromProfileId || !toProfileId) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { success: false, message: "Both profile IDs are required" },
        { status: 400 }
      );
    }

    // Validate that both IDs are valid MongoDB ObjectIds
    if (!isValidObjectId(fromProfileId)) {
      console.log("❌ Invalid fromProfileId format:", fromProfileId);
      return NextResponse.json(
        { success: false, message: "Invalid sender profile ID format" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(toProfileId)) {
      console.log("❌ Invalid toProfileId format:", toProfileId);
      return NextResponse.json(
        { success: false, message: "Invalid receiver profile ID. Cannot connect to unavailable profiles." },
        { status: 400 }
      );
    }

    // ✅ Check if target profile exists and is not dummy
    const targetProfile = await Profile.findById(toProfileId);
    if (!targetProfile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    // ✅ Get sender profile info for notification
    const senderProfile = await Profile.findById(fromProfileId);
    if (!senderProfile) {
      return NextResponse.json(
        { success: false, message: "Sender profile not found" },
        { status: 404 }
      );
    }

    // ✅ Check if connection request already exists (bidirectional check)
    const existing = await ConnectionRequest.findOne({
      $or: [
        { fromProfileId, toProfileId },
        { fromProfileId: toProfileId, toProfileId: fromProfileId }
      ]
    });

    console.log("🔍 Existing request:", existing ? `Found (${existing.status})` : "Not found");

    if (existing) {
      if (existing.status === "pending") {
        // ✅ Re-send notification for pending request
        const io = getIO();
        if (io) {
          const targetRoom = `user:${toProfileId}`;
          io.to(targetRoom).emit("connection-request-received", {
            fromProfile: {
              _id: senderProfile._id.toString(),
              name: senderProfile.name,
              imageUrl: senderProfile.imageUrl,
              age: senderProfile.age,
              gender: senderProfile.gender,
              tier: senderProfile.tier,
            },
            requestId: existing._id.toString(),
            timestamp: new Date().toISOString(),
          });
          console.log("🔔 Re-sent notification for pending request");
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "Connection request already sent (notification re-sent)",
          requestId: existing._id
        });
      } else if (existing.status === "accepted") {
        return NextResponse.json({ 
          success: false, 
          message: "Already connected with this profile" 
        });
      } else if (existing.status === "rejected") {
        // ✅ ALLOW RE-REQUEST: Update the rejected request to pending again
        console.log("♻️ Re-sending previously rejected request");
        existing.status = "pending";
        existing.updatedAt = new Date();
        await existing.save();
        
        // Emit socket notification
        const io = getIO();
        if (io) {
          const targetRoom = `user:${toProfileId}`;
          console.log("🔔 Emitting socket notification to room:", targetRoom);
          
          const room = io.sockets.adapter.rooms.get(targetRoom);
          console.log(`👥 Room ${targetRoom} has ${room ? room.size : 0} members`);
          
          io.to(targetRoom).emit("connection-request-received", {
            fromProfile: {
              _id: senderProfile._id.toString(),
              name: senderProfile.name,
              imageUrl: senderProfile.imageUrl,
              age: senderProfile.age,
              gender: senderProfile.gender,
              tier: senderProfile.tier,
            },
            requestId: existing._id.toString(),
            timestamp: new Date().toISOString(),
          });
        }
        
        return NextResponse.json({ 
          success: true,
          message: "Connection request re-sent successfully",
          requestId: existing._id
        });
      }
    }

    // ✅ Create new connection request
    const newRequest = await ConnectionRequest.create({
      fromProfileId,
      toProfileId,
      status: "pending",
    });

    console.log("✅ Connection request created:", newRequest._id);

    // ✅ Emit socket event to notify receiver in real-time
    console.log("🔍 Checking for Socket.IO instance...");
    console.log("🔍 global.io exists:", !!global.io);
    
    // ✅ Try to get IO from multiple sources
    let io = getIO();
    
    // If getIO() returns null, try to re-initialize
    if (!io) {
      console.log("⚠️ global.io not found, attempting to re-fetch...");
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/socket`);
        io = getIO();
        console.log("🔄 After re-fetch, global.io exists:", !!io);
      } catch (err) {
        console.error("❌ Failed to initialize socket:", err);
      }
    }
    
    if (io) {
      const targetRoom = `user:${toProfileId}`;
      console.log("🔔 Emitting socket notification to room:", targetRoom);
      console.log("📦 Notification data:", {
        fromProfile: {
          _id: senderProfile._id.toString(),
          name: senderProfile.name,
          tier: senderProfile.tier,
        }
      });
      
      // Check if anyone is in the room
      const room = io.sockets.adapter.rooms.get(targetRoom);
      console.log(`👥 Room ${targetRoom} has ${room ? room.size : 0} members`);
      
      if (!room || room.size === 0) {
        console.log("⚠️ Warning: Target user is not connected to socket, notification will only appear in notification center");
      }
      
      io.to(targetRoom).emit("connection-request-received", {
        fromProfile: {
          _id: senderProfile._id.toString(),
          name: senderProfile.name,
          imageUrl: senderProfile.imageUrl,
          age: senderProfile.age,
          gender: senderProfile.gender,
          tier: senderProfile.tier,
        },
        requestId: newRequest._id.toString(),
        timestamp: new Date().toISOString(),
      });
      
      console.log("✅ Socket event emitted successfully");
    } else {
      console.log("❌ Socket.IO not available - notification will not be sent in real-time");
      console.log("💡 User will see notification in notification center only");
    }

    return NextResponse.json({ 
      success: true,
      message: "Connection request sent successfully",
      requestId: newRequest._id
    });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to send connection request", 
        error: err.message 
      },
      { status: 500 }
    );
  }
}