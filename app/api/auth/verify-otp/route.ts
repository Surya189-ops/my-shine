// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";

// Same OTP store as send-otp
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

    // For testing: always accept "123456"
    const isTestOTP = otp === "123456";

    const storedData = otpStore.get(phone);

    if (!storedData && !isTestOTP) {
      return NextResponse.json(
        { success: false, message: "OTP not found or expired" },
        { status: 400 }
      );
    }

    if (storedData && Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return NextResponse.json(
        { success: false, message: "OTP has expired" },
        { status: 400 }
      );
    }

    if (!isTestOTP && storedData?.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Clear OTP
    otpStore.delete(phone);

    // Return a fake user object for testing
    const fakeUserId = Buffer.from(phone).toString("base64").slice(0, 24);

    console.log("✅ OTP verified for:", phone);

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: fakeUserId,
        phone: phone,
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