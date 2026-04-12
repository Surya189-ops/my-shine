import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function POST(req: Request) {
  try {
    const { profileId, verificationPhoto, phone } = await req.json();

    if (!profileId || !verificationPhoto || !phone) {
      return NextResponse.json(
        { success: false, message: "Profile ID, photo and phone are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await Profile.findById(profileId);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.verificationStatus === "pending") {
      return NextResponse.json(
        { success: false, message: "Verification already pending" },
        { status: 400 }
      );
    }

    if (profile.verificationStatus === "approved") {
      return NextResponse.json(
        { success: false, message: "Already verified and live on homepage" },
        { status: 400 }
      );
    }

    profile.verificationStatus = "pending";
    profile.verificationPhoto = verificationPhoto;
    profile.verificationPhone = phone;
    await profile.save();

    return NextResponse.json({
      success: true,
      message: "Verification request submitted. Pending admin approval.",
    });
  } catch (error: any) {
    console.error("Apply homepage error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}