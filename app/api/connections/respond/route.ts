// app/api/connections/respond/route.ts - Updated with Payment Flow
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { requestId, action } = await req.json();

    // ✅ Validate action
    if (!requestId || !["accepted", "rejected"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request or action",
        },
        { status: 400 }
      );
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request ID",
        },
        { status: 400 }
      );
    }

    // Find and update the connection request
    const request = await ConnectionRequest.findByIdAndUpdate(
      requestId,
      { status: action },
      { new: true }
    );

    if (!request) {
      return NextResponse.json(
        {
          success: false,
          message: "Request not found",
        },
        { status: 404 }
      );
    }

    // ✅ If accepted, emit socket event to Person A (sender) for payment
    if (action === "accepted" && global.io) {
      // Get Person B's profile (the one accepting)
      const acceptorProfile = await Profile.findOne({
        _id: request.toProfileId,
      });

      if (acceptorProfile) {
        const senderRoom = `user:${request.fromProfileId}`;

        console.log("📤 Emitting connection-accepted-notify to:", senderRoom);

        global.io.to(senderRoom).emit("connection-accepted-notify", {
          fromProfileId: request.toProfileId.toString(),
          fromName: acceptorProfile.name,
          fromImageUrl: acceptorProfile.imageUrl || "",
          tier: acceptorProfile.tier,
          requestId: requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // ✅ Get acceptor's profile for response
    const myProfile = await Profile.findOne({ _id: request.toProfileId });

    return NextResponse.json({
      success: true,
      message: `Connection ${action}`,
      request,
      myProfile: myProfile
        ? {
            imageUrl: myProfile.imageUrl,
            tier: myProfile.tier,
          }
        : null,
    });
  } catch (err) {
    console.error("RESPOND ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}