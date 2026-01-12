// app/api/connections/request/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import Profile from "@/models/Profile";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { fromProfileId, toProfileId } = await req.json();

    if (!fromProfileId || !toProfileId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (fromProfileId === toProfileId) {
      return NextResponse.json(
        { success: false, message: "Cannot connect to yourself" },
        { status: 400 }
      );
    }

    // Validate ObjectIds (prevents dummy profile connections)
    if (
      !mongoose.Types.ObjectId.isValid(fromProfileId) ||
      !mongoose.Types.ObjectId.isValid(toProfileId)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid profile ID" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existing = await ConnectionRequest.findOne({
      $or: [
        { fromProfileId, toProfileId },
        { fromProfileId: toProfileId, toProfileId: fromProfileId },
      ],
    });

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { success: false, message: "Connection request already sent" },
          { status: 400 }
        );
      }

      if (existing.status === "accepted") {
        return NextResponse.json(
          { success: false, message: "Already connected" },
          { status: 400 }
        );
      }

      // If rejected, allow re-request by updating status
      existing.status = "pending";
      existing.fromProfileId = fromProfileId;
      existing.toProfileId = toProfileId;
      await existing.save();

      // ✅ FETCH SENDER'S PROFILE DATA
      const senderProfile = await Profile.findById(fromProfileId);

      // Emit socket event with COMPLETE profile data
      if (global.io && senderProfile) {
        const userRoom = `user:${toProfileId}`;
        
        console.log("🔔 Emitting connection request to room:", userRoom);
        console.log("📦 Profile data:", {
          fromProfile: {
            _id: senderProfile._id,
            name: senderProfile.name,
            imageUrl: senderProfile.imageUrl,
            age: senderProfile.age,
            gender: senderProfile.gender,
            tier: senderProfile.tier,
          },
          requestId: existing._id,
        });

        global.io.to(userRoom).emit("connection-request-received", {
          fromProfile: {
            _id: senderProfile._id.toString(),
            name: senderProfile.name,
            imageUrl: senderProfile.imageUrl || "",
            age: senderProfile.age,
            gender: senderProfile.gender,
            tier: senderProfile.tier,
          },
          requestId: existing._id.toString(),
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        message: "Connection request sent!",
        request: existing,
      });
    }

    // Create new connection request
    const request = await ConnectionRequest.create({
      fromProfileId,
      toProfileId,
      status: "pending",
    });

    // ✅ FETCH SENDER'S PROFILE DATA
    const senderProfile = await Profile.findById(fromProfileId);

    // Emit socket event for real-time notification with COMPLETE profile data
    if (global.io && senderProfile) {
      const userRoom = `user:${toProfileId}`;
      
      console.log("🔔 Emitting connection request to room:", userRoom);
      console.log("📦 Profile data:", {
        fromProfile: {
          _id: senderProfile._id,
          name: senderProfile.name,
          imageUrl: senderProfile.imageUrl,
          age: senderProfile.age,
          gender: senderProfile.gender,
          tier: senderProfile.tier,
        },
        requestId: request._id,
      });

      global.io.to(userRoom).emit("connection-request-received", {
        fromProfile: {
          _id: senderProfile._id.toString(),
          name: senderProfile.name,
          imageUrl: senderProfile.imageUrl || "",
          age: senderProfile.age,
          gender: senderProfile.gender,
          tier: senderProfile.tier,
        },
        requestId: request._id.toString(),
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error("❌ Failed to emit socket event - missing io or profile");
    }

    return NextResponse.json({
      success: true,
      message: "Connection request sent!",
      request,
    });
  } catch (error: any) {
    console.error("Connection request error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send request" },
      { status: 500 }
    );
  }
}