import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import cloudinary from "@/lib/cloudinary";
import { extractTextFromPDF } from "@/lib/pdf-utils";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export async function POST(req: NextRequest) {
  try {
    // Basic rate limiting: 5 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    try {
      await limiter.check(5, ip);
    } catch {
      return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
    }

    const formData = await req.formData();
    const topic = formData.get("topic") as string;
    const jobDescription = formData.get("job_description") as string;
    const complexity = formData.get("complexity") as string;
    const file = formData.get("resume") as File;
    const userId = formData.get("user_id") as string; // Ideally get from auth session

    // Guest Limitation Protocol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "guest") {
      const { count } = await supabase
        .from("interviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (count !== null && count >= 3) {
        return NextResponse.json(
          { error: "Protocol limitation reached. Guest bypass unavailable. Contact admin for priority access." },
          { status: 403 }
        );
      }
    }

    let resumeUrl = "";
    let resumeText = "";

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text if it's a PDF (basic check)
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          resumeText = await extractTextFromPDF(buffer);
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "resumes" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      resumeUrl = (uploadResult as any).secure_url;
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert([
        {
          user_id: userId,
          topic,
          resume_url: resumeUrl,
          resume_text: resumeText, // Store the extracted text
          job_description: jobDescription,
          complexity,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error creating interview:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
