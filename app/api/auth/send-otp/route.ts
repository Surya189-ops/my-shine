// app/api/auth/send-otp/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// In-memory OTP storage (for development)
// In production, use Redis or database with expiry
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    console.log("📱 Sending OTP to:", phone);

    await connectDB();

    // Check if user exists
    let user = await User.findOne({ phone });

    // Generate 6-digit OTP
    const otp = "123456"; // For testing - always use this
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    console.log(`✅ OTP generated for ${phone}: ${otp}`);

    // If user doesn't exist, create new user
    if (!user) {
      user = await User.create({
        phone,
        isVerified: false,
      });
      console.log("✅ New user created:", user._id);
    } else {
      console.log("✅ Existing user found:", user._id);
    }

    // In production, send actual SMS here
    // await sendSMS(phone, `Your My Shine OTP is: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Remove this in production for security
      debug: { otp }, // Only for testing
    });
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP", error: error.message },
      { status: 500 }
    );
  }
}