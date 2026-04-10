import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(`📧 Sending OTP to ${email}: ${otp}`);

    await transporter.sendMail({
      from: `"My Shine 💖" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your My Shine OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ec4899; text-align: center;">My Shine 💖</h2>
          <p style="color: #374151;">Your OTP verification code is:</p>
          <div style="background: #fdf2f8; border: 2px solid #ec4899; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #ec4899; font-size: 40px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code expires in <strong>5 minutes</strong>.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP", error: error.message },
      { status: 500 }
    );
  }
}

export { otpStore };