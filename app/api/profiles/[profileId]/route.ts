import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    await connectDB();

    // ✅ Next.js 16 requires awaiting params
    const { profileId } = await context.params;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID missing" },
        { status: 400 }
      );
    }

    const profile = await Profile.findById(profileId).lean();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
