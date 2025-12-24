import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const profileId = searchParams.get("profileId");

    // 🔐 AUTH GUARD
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔎 REQUIRED PARAM
    if (!profileId) {
      return NextResponse.json(
        { success: false, message: "profileId is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    const activeBooking = await Booking.findOne({
      userId,
      profileId,
      status: "paid",
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    // 🚫 NO ACTIVE BOOKING → CHAT LOCKED
    if (!activeBooking) {
      return NextResponse.json(
        { success: false, active: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      active: true,
      booking: {
        startTime: activeBooking.startTime,
        endTime: activeBooking.endTime,
        duration: activeBooking.duration,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to check booking" },
      { status: 500 }
    );
  }
}
