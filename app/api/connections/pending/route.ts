import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID missing" },
        { status: 400 }
      );
    }

    const requests = await ConnectionRequest.find({
      toProfileId: profileId,
      status: "pending",
    })
      .populate("fromUserId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
