import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import Profile from "@/models/Profile";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { profileId, imageBase64 } = body;

    if (!profileId || !imageBase64) {
      return NextResponse.json(
        { success: false, message: "Missing data" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: "myshine/profiles",
    });

    // Save image URL to profile
    const profile = await Profile.findByIdAndUpdate(
      profileId,
      { imageUrl: uploadResult.secure_url },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      profile,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
