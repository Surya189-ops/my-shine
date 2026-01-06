import connectDB from "@/lib/mongodb";
import ConnectionRequest from "@/models/ConnectionRequest";
import mongoose from "mongoose";

export async function canUserChat(
  profileId1: string,
  profileId2: string
): Promise<boolean> {
  try {
    await connectDB();

    if (
      !mongoose.Types.ObjectId.isValid(profileId1) ||
      !mongoose.Types.ObjectId.isValid(profileId2)
    ) {
      return false;
    }

    const connection = await ConnectionRequest.findOne({
      $or: [
        {
          fromProfileId: profileId1,
          toProfileId: profileId2,
          status: "accepted",
        },
        {
          fromProfileId: profileId2,
          toProfileId: profileId1,
          status: "accepted",
        },
      ],
    });

    return !!connection;
  } catch (err) {
    console.error("canUserChat error:", err);
    return false;
  }
}