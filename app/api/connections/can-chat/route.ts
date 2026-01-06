import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const myProfileId = searchParams.get("myProfileId");
    const otherProfileId = searchParams.get("otherProfileId");

    if (
      !myProfileId ||
      !otherProfileId ||
      !mongoose.Types.ObjectId.isValid(myProfileId) ||
      !mongoose.Types.ObjectId.isValid(otherProfileId)
    ) {
      return NextResponse.json({ 
        success: false, 
        allowed: false,
        message: "Invalid profile IDs" 
      });
    }

    // ✅ Check with correct field names
    const connection = await ConnectionRequest.findOne({
      $or: [
        { 
          fromProfileId: myProfileId, 
          toProfileId: otherProfileId, 
          status: "accepted" 
        },
        { 
          fromProfileId: otherProfileId, 
          toProfileId: myProfileId, 
          status: "accepted" 
        },
      ],
    });

    return NextResponse.json({ 
      success: true,
      allowed: !!connection 
    });
  } catch (err) {
    console.error("CAN CHAT ERROR:", err);
    return NextResponse.json({ 
      success: false, 
      allowed: false,
      message: "Server error" 
    });
  }
}