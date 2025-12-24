import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET() {
  try {
    await connectDB();

    // ✅ ONLY MALE PROFILES WITH TIER
    const profiles = await Profile.find({
      gender: "male",
      tier: { $in: ["bronze", "silver", "gold"] },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error) {
    console.error("Fetch profiles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
