// app/api/connections/request/route.ts - Updated with block check
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import BlockedUser from "@/models/BlockedUser";
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

    // CHECK IF BLOCKED
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { blockerProfileId: fromProfileId, blockedProfileId: toProfileId },
        { blockerProfileId: toProfileId, blockedProfileId: fromProfileId },
      ],
    });

    if (isBlocked) {
      return NextResponse.json(
        { success: false, message: "Cannot send connection request to this user" },
        { status: 403 }
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

      // Emit socket event
      if (global.io) {
        const userRoom = `user:${toProfileId}`;
        global.io.to(userRoom).emit("connection-request-received", {
          fromProfileId,
          toProfileId,
          requestId: existing._id,
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

    // Emit socket event for real-time notification
    if (global.io) {
      const userRoom = `user:${toProfileId}`;
      console.log("🔔 Emitting connection request to room:", userRoom);

      global.io.to(userRoom).emit("connection-request-received", {
        fromProfileId,
        toProfileId,
        requestId: request._id,
      });
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