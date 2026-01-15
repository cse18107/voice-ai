import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, 
  uniqueTokenPerInterval: 500,
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    try {
      await limiter.check(10, ip);
    } catch {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}`, {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch conversation from ElevenLabs");
    }

    const data = await response.json();
    
    // Inject the audio URL pointing to our local proxy
    const enhancedData = {
      ...data,
      audio_url: `/api/elevenlabs/conversation/${id}/audio`
    };
    
    return NextResponse.json(enhancedData);
  } catch (error: any) {
    console.error("ElevenLabs API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
