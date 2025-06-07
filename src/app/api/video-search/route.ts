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

    const prompt = `The scenerio is that you are in a chat with an user who is searching for a specific thing in within the youtube video, you are given the following things for context:
        Video_Transcript : a transcript of the video, 
        VideoAnalysis: a breakdown of the main topics that are discussed in the video, with timestamps for each topic in the format HH:MM:SS, 
        VideoURL: youtube url of the video.
    Feel free to use them as needed, if the question is about something that is visually presented in the video you may have to further analyze the video of the given url to answer the question. Your task is to find the specific thing the user is searching for in the video whether its a visual search or an auditory one and provide the starting time of when it appears in seconds, if you are unable to find it, respond with "I don't know".
        
        <VideoTranscript>
        Transcript: ${
          cachedQueryTranscript
            ? JSON.parse(cachedQueryTranscript)
                .map(
                  (t: { offset: number; text: string }) =>
                    `[${t.offset}] ${t.text}`
                )
                .join("\n")
            : ""
        }
        </VideoTranscript>
        
        <VideoAnalysis>
        Analysis: ${cachedQueryAnalysis || ""}
        </VideoAnalysis>
        
        <VideoURL>
        ${videoUrl || ""}
        </VideoURL>

        The user's question is: "${searchQuestion}". 
        Provide your response in the following JSON format:
        {
            "startingTime": "seconds",
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
