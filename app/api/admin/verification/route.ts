import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET() {
  try {
    await connectDB();
    const pending = await Profile.find({ verificationStatus: "pending" }).lean();
    return NextResponse.json({ success: true, profiles: pending });
  } catch (error) {
    console.error("Verification fetch error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { profileId, action } = await req.json();

    if (!profileId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    await connectDB();

    const update =
      action === "approve"
        ? { verificationStatus: "approved", isCameraVerified: true, isOnHomepage: true }
        : { verificationStatus: "rejected", isCameraVerified: false, isOnHomepage: false };

    await Profile.findByIdAndUpdate(profileId, update);

    return NextResponse.json({
      success: true,
      message: action === "approve"
        ? "Profile approved and live on homepage"
        : "Profile rejected",
    });
  } catch (error) {
    console.error("Verification action error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}