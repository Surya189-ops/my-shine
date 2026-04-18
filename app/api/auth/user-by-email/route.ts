// app/api/auth/user-by-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ success: false, message: "Email required" });

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, message: "User not found" });

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (err) {
    console.error("user-by-email error:", err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}