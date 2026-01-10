// app/api/profiles/search/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const gender = searchParams.get("gender");

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        profiles: [],
        message: "Query too short"
      });
    }

    await connectDB();

    // Build search filter
    const filter: any = {
      name: { $regex: query, $options: "i" } // Case-insensitive search
    };

    // Add gender filter if provided
    if (gender && (gender === "male" || gender === "female")) {
      filter.gender = gender;
    }

    console.log("🔍 Searching profiles with filter:", filter);

    const profiles = await Profile.find(filter)
      .select("name age gender tier country imageUrl bio")
      .limit(50) // Limit results
      .lean();

    console.log(`✅ Found ${profiles.length} profiles matching "${query}"`);

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length
    });
  } catch (error: any) {
    console.error("❌ Search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Search failed",
        error: error.message
      },
      { status: 500 }
    );
  }
}