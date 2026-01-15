// FILE 2: app/api/notifications/payment/decline/route.ts - NEW FILE
import { NextRequest, NextResponse } from "next/server";
import { Server } from "socket.io";

export async function POST(req: NextRequest) {
  try {
    const { fromProfileId, requestId } = await req.json();

    if (!fromProfileId || !requestId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("💔 Sending payment declined notification:", { fromProfileId, requestId });

    // Get Socket.IO instance from global
    const io = (global as any).io as Server;

    if (io) {
      // Emit payment declined event to the sender
      io.to(`user:${fromProfileId}`).emit("payment-declined-notify", {
        fromProfileId,
        requestId,
        timestamp: new Date(),
      });

      console.log(`📤 Payment declined notification sent to: user:${fromProfileId}`);
    }

    return NextResponse.json({
      success: true,
      message: "Payment declined notification sent",
    });
  } catch (error: any) {
    console.error("❌ Send payment declined error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}