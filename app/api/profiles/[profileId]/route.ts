import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Profile from "@/models/Profile";

export async function GET(
  req: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const profile = await Profile.findById(profileId);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        _id: profile._id.toString(),
        name: profile.name,
        age: profile.age,
        bio: profile.bio,
        tier: profile.tier,
        gender: profile.gender,
        country: profile.country,
        imageUrl: profile.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}