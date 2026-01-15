import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    // Fetch binary audio data from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${id}/audio`, {
      method: 'GET',
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      console.error(`ElevenLabs Audio Error: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "Failed to retrieve audio" }, { status: response.status });
    }

    // Stream the audio back to the client
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600"
      },
    });

  } catch (error: any) {
    console.error("Audio Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
