import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/app/config/env";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // TODO: Add input validation here
    // // Example: validate required fields like video file, analysis type, etc.
    // if (!body) {
    //   return NextResponse.json(
    //     { error: "Request body is required" },
    //     { status: 400 }
    //   );
    // }
    const videoUrl = body.videoUrl;

    const genAI = new GoogleGenerativeAI(env.GEM_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      "Please summarize the video in 3 sentences.",
      {
        fileData: {
          fileUri: videoUrl,
          mimeType: "video/mp4",
        },
      },
    ]);

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
