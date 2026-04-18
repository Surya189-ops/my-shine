// app/api/detect-country/route.ts
import { NextRequest, NextResponse } from "next/server";

// Countries whose users can apply to homepage
const HOMEPAGE_COUNTRIES = ["JP", "KR", "BR", "CO", "VE", "AR"];

export async function GET(req: NextRequest) {
  try {
    // Get IP from Vercel headers (works on Vercel deployment)
    const ip =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Use ip-api.com (free, no key needed)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      next: { revalidate: 0 },
    });

    const geoData = await geoRes.json();
    const countryCode: string = geoData.countryCode || "UNKNOWN";
    const canApplyToHomepage = HOMEPAGE_COUNTRIES.includes(countryCode);

    return NextResponse.json({ success: true, countryCode, canApplyToHomepage });
  } catch (error) {
    console.error("Country detect error:", error);
    // On error, default to NOT showing Apply to Homepage (safe default)
    return NextResponse.json({ success: false, countryCode: "UNKNOWN", canApplyToHomepage: false });
  }
}