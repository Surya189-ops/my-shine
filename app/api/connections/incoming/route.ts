import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    // ✅ Validate profileId
    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        { success: true, requests: [] },
        { status: 200 }
      );
    }

    // ✅ Find all pending requests TO this profile
    const requests = await ConnectionRequest.find({
      toProfileId: profileId,
      status: "pending",
    })
      .populate("fromProfileId", "name imageUrl age gender tier country") // ✅ Added more fields
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (err) {
    console.error("INCOMING CONNECTION ERROR:", err);
    return NextResponse.json(
      { success: true, requests: [] },
      { status: 200 }
    );
  }
}