// app/api/auth/ensure-google-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, name, image } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: "Email required" });

    await connectDB();

    // Always try findOne first — avoids any upsert index conflicts
    let user = await User.findOne({ email });

    if (!user) {
      // Create with only the fields in our schema — no phone field
      user = await User.create({
        email,
        name: name || "",
        image: image || "",
        googleId: `google_${Date.now()}_${Math.random()}`, // unique placeholder
        authProvider: "google",
        isVerified: true,
        password: null,
      });
    }

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (err: any) {
    console.error("ensure-google-user error:", err);
    return NextResponse.json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
}