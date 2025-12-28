import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender") || "male";

    if (!["male", "female", "other"].includes(gender)) {
      return NextResponse.json(
        { success: false, message: "Invalid gender parameter" },
        { status: 400 }
      );
    }

    const profiles = await Profile.find({
      gender,
      tier: { $in: ["bronze", "silver", "gold"] },
    })
      .select(
        "_id name age bio gender tier country isCameraVerified imageUrl createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Fetch profiles error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
