import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/app/config/env";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const videoUrl = body.videoUrl;
    //TODO: check if video has a transcription already else do below
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

    const genAI = new GoogleGenerativeAI(env.GEM_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Analyze this transcript and provide a breakdown of the main topics that are discussed in the video, with timestamps for each topic.
      <VideoTranscript>
        Transcript: ${transcript.map(t => `[${t.offset}] ${t.text}`).join("\n")}
      </VideoTranscript>`;

    // TODO: check prompt is not empty else do not send to gemeni
    const result = await model.generateContent([prompt]);

    // TODO: Add video analysis logic here
    // This could include:
    // - File upload handling
    // - Video processing
    // - AI/ML analysis
    // - Database operations

    console.log("Received gemini result,", result.response.text());
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Video analysis error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
