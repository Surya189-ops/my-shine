// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Same OTP store as send-otp (in production, use Redis/DB)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    console.log("🔐 Verifying OTP for:", phone);

    await connectDB();

    // Get stored OTP
    const storedData = otpStore.get(phone);

    // For testing: always accept "123456"
    const isTestOTP = otp === "123456";

    if (!storedData && !isTestOTP) {
      return NextResponse.json(
        { success: false, message: "OTP not found or expired" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (storedData && Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!isTestOTP && storedData.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        isVerified: true,
      });
      console.log("✅ New user created and verified:", user._id);
    } else {
      user.isVerified = true;
      await user.save();
      console.log("✅ Existing user verified:", user._id);
    }

    // Clear OTP from store
    otpStore.delete(phone);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user._id.toString(),
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("❌ Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP", error: error.message },
      { status: 500 }
    );
  }
}