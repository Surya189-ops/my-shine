// app/api/messages/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { success: false, message: "Text and target language required" },
        { status: 400 }
      );
    }

    // Using Google Translate API (free tier)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    // Extract translated text from response
    const translatedText = data[0].map((item: any) => item[0]).join("");

    return NextResponse.json({
      success: true,
      translatedText,
      originalText: text,
      detectedLanguage: data[2] || "unknown",
    });
  } catch (error: any) {
    console.error("❌ Translation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Translation failed" },
      { status: 500 }
    );
  }
}