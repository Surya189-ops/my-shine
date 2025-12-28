import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import mongoose from "mongoose";

// Helper to check if ID is a valid MongoDB ObjectId (24-char hex string)
const isValidObjectId = (id: string) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;
};

export async function POST(req: Request) {
  try {
    console.log("▶️ Connection request API hit");

    await connectDB();
    console.log("✅ DB connected");

    const body = await req.json();
    console.log("📦 Request body:", body);

    const { fromUserId, toProfileId } = body;

    // Validate required fields
    if (!fromUserId || !toProfileId) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { success: false, message: "User ID and Profile ID are required" },
        { status: 400 }
      );
    }

    // Validate that both IDs are valid MongoDB ObjectIds
    // This prevents requests to placeholder profiles (e.g., "b1", "s1", "g1")
    if (!isValidObjectId(fromUserId)) {
      console.log("❌ Invalid fromUserId format:", fromUserId);
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(toProfileId)) {
      console.log("❌ Invalid toProfileId format:", toProfileId);
      return NextResponse.json(
        { success: false, message: "Invalid profile ID. Cannot connect to unavailable profiles." },
        { status: 400 }
      );
    }

    // Check if connection request already exists (any status)
    const existing = await ConnectionRequest.findOne({
      fromUserId,
      toProfileId,
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

    // Create new connection request
    const newRequest = await ConnectionRequest.create({
      fromUserId,
      toProfileId,
      status: "pending",
    });

    console.log("✅ Connection request created:", newRequest._id);

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