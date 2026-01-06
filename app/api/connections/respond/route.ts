import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { requestId, action } = await req.json();

    // ✅ Validate action
    if (!requestId || !["accepted", "rejected"].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request or action" 
      }, { status: 400 });
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid request ID" 
      }, { status: 400 });
    }

    const request = await ConnectionRequest.findByIdAndUpdate(
      requestId,
      { status: action },
      { new: true }
    );

    if (!request) {
      return NextResponse.json({ 
        success: false, 
        message: "Request not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Connection ${action}`,
      request 
    });
  } catch (err) {
    console.error("RESPOND ERROR:", err);
    return NextResponse.json({ 
      success: false, 
      message: "Server error" 
    }, { status: 500 });
  }
}