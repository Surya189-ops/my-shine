// app/api/connections/reset/route.ts
// ⚠️ TESTING ONLY - Remove in production
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "ProfileId required" },
        { status: 400 }
      );
    }

    // Delete all connection requests involving this profile
    const result = await ConnectionRequest.deleteMany({
      $or: [
        { fromProfileId: profileId },
        { toProfileId: profileId }
      ]
    });

    console.log(`🗑️ Deleted ${result.deletedCount} connection requests for profile: ${profileId}`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} connection requests`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("RESET ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to reset connections" },
      { status: 500 }
    );
  }
}