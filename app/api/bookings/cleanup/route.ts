import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function POST() {
  try {
    await connectDB();

    const now = new Date();

    const result = await Booking.updateMany(
      {
        status: "paid",
        endTime: { $lt: now },
      },
      {
        $set: { status: "completed" },
      }
    );

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Booking cleanup error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
