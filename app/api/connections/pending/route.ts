import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Profile ID" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Find requests FROM this profile (that are pending)
    const requests = await ConnectionRequest.find({
      fromProfileId: profileId, // ✅ CHANGED from fromUserId
      status: "pending",
    })
      .populate("toProfileId", "name imageUrl age gender tier country")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (err) {
    console.error("PENDING REQUESTS ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}