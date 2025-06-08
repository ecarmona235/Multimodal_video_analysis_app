import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/utils/geminiClient";
import redis from "@/utils/redis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const videoUrl = body.videoUrl;
    const searchQuestion = body.searchQuestion || "";

    const cachedQueryTranscript = await redis.hget(
      `initial_query:${videoUrl}`,
      `transcript`
    );
    const cachedQueryAnalysis = await redis.hget(
      `initial_query:${videoUrl}`,
      `long analysis`
    );
    console.log("search question:", searchQuestion);
    const prompt = `You are an AI assistant specialized in analyzing YouTube videos to locate specific moments based on the provided video transcript, Youtube URL and your past analysis. The goal is to identify the starting time (HH:MM:SS) where the user's search query is visually or audibly represented in the video.
        **Given Context:**

        <VideoTranscript>
        Transcript: ${
          cachedQueryTranscript
            ? JSON.parse(cachedQueryTranscript)
                .map(
                  (t: { offset: number; text: string }) =>
                    `[${t.offset}] ${t.text}` // Timestamps in seconds
                )
                .join("\n")
            : ""
        }
        </VideoTranscript>

        <VideoAnalysis>
        Analysis: ${cachedQueryAnalysis || ""} // Timestamps in HH:MM:SS
        </VideoAnalysis>

        <VideoURL>
        ${videoUrl || ""}
        </VideoURL>

        **Task:**

        1.  Analyze the provided VideoTranscript and VideoAnalysis in conjunction with the user's searchQuestion.
        2.  Determine the specific moment in the video that corresponds to the user's question, considering both auditory and visual cues mentioned in the context.
        3.  If the search query is related to a timestamp found in the VideoAnalysis, use that timestamp (HH:MM:SS).
        4.  If the search query is related to a timestamp found in the VideoTranscript (which are in seconds), convert the seconds to HH:MM:SS format.
        5.  If multiple instances of the search query exist, return the starting time of the *first* instance found.
        6.  If the requested moment in the video cannot be confidently identified based on the provided context, use the url to search the video.

        **User's Question:**

        "${searchQuestion}"

        **Desired Output Format:**

        json
        {
            "startingTime": "HH:MM:SS" 
        }`;

    const result = await getGeminiResponse([
      {
        role: "user",
        content: prompt,
      },
    ]);

    console.log("Search result:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Video chat error:", error);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
