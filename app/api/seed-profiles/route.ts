import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Profile from "../../../models/Profile";

export async function POST() {
  try {
    await connectDB();

    const demoUsers = [
      { phone: "9000000001", isVerified: true },
      { phone: "9000000002", isVerified: true },
      { phone: "9000000003", isVerified: true },
      { phone: "9000000004", isVerified: true },
      { phone: "9000000005", isVerified: true },
    ];

    const createdUsers = [];

    for (const userData of demoUsers) {
      let user = await User.findOne({ phone: userData.phone });
      if (!user) {
        user = await User.create(userData);
      }
      createdUsers.push(user);
    }

    const demoProfiles = [
      {
        userId: createdUsers[0]._id,
        name: "Sam Oppa",
        age: 32,
        bio: "Friendly talk expert",
        gender: "male",
        isCameraVerified: true,
        tier: "bronze",
      },
      {
        userId: createdUsers[1]._id,
        name: "Raymond Oppa",
        age: 30,
        bio: "Chill conversations & fun vibes",
        gender: "male",
        isCameraVerified: true,
        tier: "bronze",
      },
      {
        userId: createdUsers[2]._id,
        name: "Jay Oppa",
        age: 28,
        bio: "Good listener, positive energy",
        gender: "male",
        isCameraVerified: true,
        tier: "silver",
      },
      {
        userId: createdUsers[3]._id,
        name: "Anna",
        age: 26,
        bio: "Casual talks & laughter",
        gender: "female",
        isCameraVerified: true,
        tier: "silver",
      },
      {
        userId: createdUsers[4]._id,
        name: "Mia",
        age: 29,
        bio: "Deep conversations & support",
        gender: "female",
        isCameraVerified: true,
        tier: "gold",
      },
    ];

    for (const profileData of demoProfiles) {
      const exists = await Profile.findOne({ userId: profileData.userId });
      if (!exists) {
        await Profile.create(profileData);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo users & profiles seeded successfully",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed profiles" },
      { status: 500 }
    );
  }
}
