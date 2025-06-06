import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript, TranscriptResponse } from "youtube-transcript";
import { getGeminiResponse } from "@/utils/geminiClient";
import redis from "@/utils/redis";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const videoUrl = body.videoUrl;
    //TODO: check if video has a transcription already else do below
    const cachedQueryTranscript = await redis.hget(
      `initial_query:${videoUrl}`,
      `transcript`
    );
    let transcript: TranscriptResponse[] = [];
    if (cachedQueryTranscript) {
      transcript = JSON.parse(cachedQueryTranscript);
    } else {
      transcript = await YoutubeTranscript.fetchTranscript(videoUrl);

      if (transcript.length > 0) {
        await redis.hset(
          `initial_query:${videoUrl}`,
          `transcript`,
          JSON.stringify(transcript)
        );
      }
    }
    const prompt = `Analyze this transcript and provide a breakdown of the main topics that are discussed in the video, with timestamps for each topic.
      <VideoTranscript>
        Transcript: ${transcript.map((t: TranscriptResponse) => `[${t.offset}] ${t.text}`).join("\n")}
      </VideoTranscript>
      
      Provide your response in the following JSON format:
      {
        "topics": [
          {
            "timestamp": "HH:MM:SS",
            "topic": "Topic name"
          } 
        ]
      }
      `;
    const result = await getGeminiResponse([
      {
        role: "user",
        content: prompt,
      },
    ]);

    if (result.length > 0) {
      await redis.hset(`initial_query:${videoUrl}`, `long analysis`, result);
    }
    await redis.expire(`initial_query:${videoUrl}`, 3600); // Set expiration to 1 hour
    console.log("Video analysis result:", result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Video analysis error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
