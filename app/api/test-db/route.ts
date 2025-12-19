import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ success: true, message: "DB connected" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "DB connection failed" },
      { status: 500 }
    );
  }
}
