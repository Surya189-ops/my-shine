import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    // 🔎 REQUIRED PARAM
    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId is required" },
        { status: 400 }
      );
    }

    // 🔎 VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        { success: false, message: "Invalid profileId" },
        { status: 400 }
      );
    }

    const profile = await Profile.findById(profileId);

    // 🚫 NOT FOUND
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
