import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { email, otp, password, isLogin } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return NextResponse.json(
        { success: false, message: "OTP not found or expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (storedData.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    otpStore.delete(email);

    await connectDB();

    let user = await User.findOne({ email });

    if (isLogin) {
      if (!user) {
        return NextResponse.json(
          { success: false, message: "No account found with this email. Please sign up." },
          { status: 404 }
        );
      }

      user.isVerified = true;
      await user.save();
    } else {
      if (!password) {
        return NextResponse.json(
          { success: false, message: "Password is required for signup" },
          { status: 400 }
        );
      }

      if (user) {
        if (user.isVerified) {
          return NextResponse.json(
            { success: false, message: "Account already exists. Please login." },
            { status: 400 }
          );
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        user.isVerified = true;
        await user.save();
      } else {
        const hashedPassword = await bcrypt.hash(password, 12);
        user = await User.create({
          email,
          password: hashedPassword,
          isVerified: true,
          authProvider: "email",
        });
      }
    }

    console.log(`✅ OTP verified for: ${email}`);

    return NextResponse.json({
      success: true,
      message: "Verified successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || "",
        provider: user.authProvider,
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