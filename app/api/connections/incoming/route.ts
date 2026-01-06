// app/api/connections/incoming/route.ts
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
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Manually populate fromProfileId data
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const fromProfile = await Profile.findById(request.fromProfileId).lean();
        return {
          ...request,
          fromProfileId: fromProfile || null,
        };
      })
    );

    // ✅ Filter out requests where profile wasn't found
    const validRequests = populatedRequests.filter(
      (r) => r.fromProfileId !== null
    );

    console.log("📥 Incoming requests found:", validRequests.length);

    return NextResponse.json({ success: true, requests: validRequests });
  } catch (err) {
    console.error("INCOMING CONNECTION ERROR:", err);
    return NextResponse.json(
      { success: true, requests: [] },
      { status: 200 }
    );
  }
}