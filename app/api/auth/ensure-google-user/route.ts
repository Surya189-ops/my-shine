// app/api/auth/ensure-google-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, name, image } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: "Email required" });

    await connectDB();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        image,
        authProvider: "google",
        isVerified: true,
      });
    }

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (err) {
    console.error("ensure-google-user error:", err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}