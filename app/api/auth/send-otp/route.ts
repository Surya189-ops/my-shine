// app/api/auth/send-otp/route.ts
import { NextResponse } from "next/server";

// In-memory OTP storage
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

    // Generate 6-digit OTP (hardcoded for testing)
    const otp = "123456";

    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(`✅ OTP generated for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      debug: { otp },
    });
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP", error: error.message },
      { status: 500 }
    );
  }
}