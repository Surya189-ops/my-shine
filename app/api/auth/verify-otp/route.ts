import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    // TEMP OTP CHECK (later replace with real OTP service)
    if (otp !== "123456") {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ phone });

    // If not, create new user
    if (!user) {
      user = await User.create({ phone });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified",
      user: {
        id: user._id,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
