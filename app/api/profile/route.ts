import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";




export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, age, bio, gender, isCameraVerified } = body;

    await connectDB();

    let profile = await Profile.findOne({ userId });

    if (profile) {
      profile.name = name;
      profile.age = age;
      profile.bio = bio;
      profile.gender = gender;
      profile.isCameraVerified = isCameraVerified;
      await profile.save();
    } else {
      profile = await Profile.create({
        userId,
        name,
        age,
        bio,
        gender,
        isCameraVerified,
      });
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

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Fetch failed" },
      { status: 500 }
    );
  }
}
