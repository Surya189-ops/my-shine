import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { userId, profileId, tier, duration, price } = await req.json();

    // 🔐 AUTH GUARD
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔎 REQUIRED FIELDS
    if (!profileId || !tier || !duration || !price) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const now = new Date();

    const booking = await Booking.create({
      userId,
      profileId,
      tier,
      duration,
      price,
      status: "paid", // mock payment success
      startTime: now,
      endTime: new Date(
        now.getTime() + duration * 60 * 1000
      ),
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to extend chat" },
      { status: 500 }
    );
  }
}
