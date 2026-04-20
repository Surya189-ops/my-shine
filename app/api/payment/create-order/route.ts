import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, profileId } = await req.json();

    // Razorpay receipt must be max 40 characters
    const shortId = String(profileId).slice(-8);
    const receipt = `rcpt_${shortId}_${Date.now().toString().slice(-8)}`;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt, // guaranteed ≤ 40 chars: "rcpt_" (5) + 8 + "_" (1) + 8 = 22 chars
      notes: { profileId },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Razorpay order error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}