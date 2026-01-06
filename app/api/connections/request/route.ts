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
        return NextResponse.json({ 
          success: false, 
          message: "Connection request already sent" 
        });
      } else if (existing.status === "accepted") {
        return NextResponse.json({ 
          success: false, 
          message: "Already connected with this profile" 
        });
      } else if (existing.status === "rejected") {
        return NextResponse.json({ 
          success: false, 
          message: "Connection request was previously rejected" 
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
    const io = getIO();
    if (io) {
      console.log("🔔 Emitting socket notification to:", toProfileId);
      io.emit("connection-request-sent", {
        toProfileId: toProfileId.toString(),
        fromProfile: {
          _id: senderProfile._id.toString(),
          name: senderProfile.name,
          imageUrl: senderProfile.imageUrl,
          age: senderProfile.age,
          gender: senderProfile.gender,
          tier: senderProfile.tier,
        },
        requestId: newRequest._id.toString(),
      });
    } else {
      console.log("⚠️ Socket.IO not available");
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