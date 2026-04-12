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

    const filter: any = {
      name: { $regex: `^${query.trim()}`, $options: "i" } // ^ = starts with
    };

    if (gender && (gender === "male" || gender === "female")) {
      filter.gender = gender;
    }

    console.log("🔍 Searching profiles starting with:", query);

    const profiles = await Profile.find(filter)
      .select("name age gender tier country imageUrl bio")
      .limit(50)
      .lean();

    console.log(`✅ Found ${profiles.length} profiles starting with "${query}"`);

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length
    });
  } catch (error: any) {
    console.error("❌ Search error:", error);
    return NextResponse.json(
      { success: false, message: "Search failed", error: error.message },
      { status: 500 }
    );
  }
}