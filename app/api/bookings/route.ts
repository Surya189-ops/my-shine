import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";

/* -------- CREATE BOOKING -------- */
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

    const booking = await Booking.create({
      userId,
      profileId,
      tier,
      duration,
      price,
      status: "pending",
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}

/* -------- GET USER BOOKINGS -------- */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // 🔐 AUTH GUARD
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .populate("profileId", "name imageUrl");

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/* -------- UPDATE BOOKING STATUS -------- */
export async function PATCH(req: Request) {
  try {
    await connectDB();

    const { bookingId, status } = await req.json();

    // 🔎 REQUIRED FIELDS
    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["pending", "paid", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);

    // ❌ NOT FOUND
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // ⏱ SET TIME WINDOW WHEN PAID
    if (status === "paid") {
      const now = new Date();
      booking.status = "paid";
      booking.startTime = now;
      booking.endTime = new Date(
        now.getTime() + booking.duration * 60 * 1000
      );
    } else {
      booking.status = status;
    }

    await booking.save();

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}
