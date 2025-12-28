import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { requestId, action } = await req.json();

    if (!requestId || !["accepted", "rejected"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid data" },
        { status: 400 }
      );
    }

    const request = await ConnectionRequest.findById(requestId);

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    request.status = action;
    await request.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to update request" },
      { status: 500 }
    );
  }
}
