import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    await connectDB();

    const bookings = await Booking.find();

    const totalBookings = bookings.length;

    const activeBookings = bookings.filter(
      (b) => b.status === "paid"
    ).length;

    const completedBookings = bookings.filter(
      (b) => b.status === "completed"
    ).length;

    const totalRevenue = bookings
      .filter((b) => b.status === "paid" || b.status === "completed")
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const revenueByTier: Record<string, number> = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
    };

    bookings.forEach((b) => {
      if (
        (b.status === "paid" || b.status === "completed") &&
        revenueByTier[b.tier] !== undefined
      ) {
        revenueByTier[b.tier] += b.price;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalRevenue,
        revenueByTier,
      },
    });
  } catch (error) {
    console.error("Admin summary error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
