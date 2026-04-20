import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      name,
      age,
      bio,
      gender,
      isCameraVerified,
    } = body;

    /* ---------- VALIDATION ---------- */
    if (!userId || !name || !age || !gender) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    let profile = await Profile.findOne({ userId });

    const profileData: any = {
      userId,
      name,
      age,
      bio,
      gender,
      isCameraVerified,
    };

    if (profile) {
      Object.assign(profile, profileData);
      await profile.save();
    } else {
      profile = await Profile.create(profileData);
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("PROFILE SAVE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Profile save failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID missing" },
        { status: 400 }
      );
    }

    await connectDB();
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Fetch failed" },
      { status: 500 }
    );
  }
}