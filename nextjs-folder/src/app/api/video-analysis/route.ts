import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript, TranscriptResponse } from "youtube-transcript";
import { getGeminiResponse } from "@/utils/geminiClient";
import redis from "@/utils/redis";
import { getYouTubeVideoIdFromUrl } from "@/utils/youtube";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const videoUrl = body.videoUrl;
    const videoId = getYouTubeVideoIdFromUrl(videoUrl) || "";
    //TODO: check if video has a transcription already else do below
    const cachedQueryTranscript = await redis.hget(
      `initial_query:${videoUrl}`,
      `transcript`
    );
    let transcript: TranscriptResponse[] = [];
    if (cachedQueryTranscript) {
      transcript = JSON.parse(cachedQueryTranscript);
      console.log("logging cached: ", transcript);
    } else {
      transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
      console.log("logging: ", transcript);
      if (transcript.length !== 0) {
        console.log(transcript);
        await redis.hset(
          `initial_query:${videoUrl}`,
          `transcript`,
          JSON.stringify(transcript)
        );
      } else {
        console.log("404 error on youtube transcript");
      }
    }

    const prompt = `Analyze this transcript, where the offset time is given in seconds, and provide a breakdown of the main topics that are discussed in the video, with timestamps for each topic.
      Video_Transcript : a transcript of the video in the formt of offset in seconds and text 
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
      await redis.expire(`initial_query:${videoUrl}`, 3600); // Set expiration to 1 hour
    }

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
