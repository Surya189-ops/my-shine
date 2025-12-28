import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ success: false });
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
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
