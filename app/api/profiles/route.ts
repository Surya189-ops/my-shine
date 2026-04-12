import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender");
    const country = searchParams.get("country");

    const query: any = {
      isOnHomepage: true,
    };

    if (gender && ["male", "female", "other"].includes(gender)) {
      query.gender = gender;
    }

    if (country) {
      query.country = country;
    }

    const profiles = await Profile.find(query)
      .select("_id name age bio gender country isCameraVerified imageUrl createdAt")
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