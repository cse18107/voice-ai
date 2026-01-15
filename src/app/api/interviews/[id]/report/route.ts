import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("interview_reports")
      .select("*")
      .eq("interview_id", id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    return NextResponse.json(data || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { OpenAI } from "openai";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

// ... existing GET ...

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Rate limiting: 3 reports per hour per user/IP
    try {
      await limiter.check(3, ip);
    } catch {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    
    // 1. Fetch Interview Details
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("topic, job_description, conversation_id")
      .eq("id", id)
      .single();

    if (fetchError || !interview) {
      console.error("[Report Generation] Interview not found");
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    console.log(`[Report Generation] Conversation ID: ${interview.conversation_id}`);

    if (!interview.conversation_id) {
      return NextResponse.json({ error: "Conversation ID not found. Interview might not have started." }, { status: 400 });
    }

    // 2. Fetch Transcript
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    console.log(`[Report Generation] API Key Present: ${!!elevenLabsApiKey}`);
    
    const convRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${interview.conversation_id}`, {
      method: 'GET',
      headers: { 'xi-api-key': elevenLabsApiKey || '' }
    });

    if (!convRes.ok) {
       console.error(`[Report Generation] ElevenLabs Error: ${convRes.status} ${await convRes.text()}`);
       throw new Error("Failed to fetch transcript from ElevenLabs");
    }

    const convData = await convRes.json();
    const transcript = convData.transcript || []; 
    console.log(`[Report Generation] Transcript Length: ${transcript.length}`);
    
    if (transcript.length === 0) {
        console.warn("[Report Generation] Transcript is empty. Cannot analyze.");
        // Instead of 400, return a specific error so frontend can show "No audio detected"
        return NextResponse.json({ error: "No conversation detected (Transcript empty)" }, { status: 400 });
    }

    // 3. Call OpenAI to Analyze
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const systemPrompt = `You are an expert technical interviewer and career coach.
    Analyze the following interview based on the Job Topic and Description.
    Provide a JSON output with the following schema:
    {
      "overall_score": number (0-100),
      "confidence": number (0-100),
      "clarity": number (0-100),
      "relevance": number (0-100),
      "strengths": string[] (max 3-5 key points),
      "improvements": string[] (max 3-5 actionable tips),
      "priority_areas": string[] (max 3 areas to focus on),
      "action_plan": { "title": string, "description": string, "estimated_time": string, "priority": "High" | "Medium" | "Low" }[] (max 3 items)
    }
    Be strict but constructive.`;

    const userPrompt = `
    Job Topic: ${interview.topic}
    Job Description: ${interview.job_description || "Not provided"}
    
    Transcript:
    ${JSON.stringify(transcript)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("OpenAI returned empty content");
    
    const reportData = JSON.parse(content);

    // 4. Save to Database
    const { data, error: upsertError } = await supabase
      .from("interview_reports")
      .upsert({
        interview_id: id,
        ...reportData
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
