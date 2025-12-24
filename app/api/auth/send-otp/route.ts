import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { phone } = body;

  if (!phone) {
    return NextResponse.json(
      { success: false, message: "Phone number required" },
      { status: 400 }
    );
  }

  // Fake OTP for now
  const otp = "123456";

  // In real app: store OTP in DB / cache
  

  return NextResponse.json({
    success: true,
    message: "OTP sent successfully",
  });
}
