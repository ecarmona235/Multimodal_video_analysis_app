import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/utils/geminiClient";
import redis from "@/utils/redis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const videoUrl = body.videoUrl;
    const chatquestion = body.chatQuestion || "";
    const chatCount = body.chatCount || 0;
    const cachedChats = [];
    for (let i = 0; i <= chatCount; i++) {
      const cachedChat = await redis.hget(
        `initial_query:${videoUrl}`,
        `prior_chats:${i}`
      );
      if (cachedChat) {
        cachedChats.push(cachedChat);
      }
    }

    const cachedQueryTranscript = await redis.hget(
      `initial_query:${videoUrl}`,
      `transcript`
    );
    const cachedQueryAnalysis = await redis.hget(
      `initial_query:${videoUrl}`,
      `long analysis`
    );

    const prompt = `The scenerio is that you are in a chat with an user who is watching a Youtube video, you provded the user with a breakdown of the video, and now the user has a question about the video or about something mentioned in the video. Your task is to answer the user's question or further explain any in the video, you are given the following things for context, feel free to use them as you need:
        Video_Transcript : a transcript of the video, 
        VideoAnalysis: a breakdown of the main topics that are discussed in the video, with timestamps for each topic in the format HH:MM:SS, 
        PriorChats: any prior questions from user and your answers in the format of question:response, 
        VideoURL: youtube url of the video. 
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
        <PriorChats>
        ${cachedChats.length > 0 ? cachedChats.join("\n") : ""}
        </PriorChats>
        <VideoURL>
        ${videoUrl || ""}
        </VideoURL>   

        Answer the following question:"${chatquestion}".  
        Provide your response in the following format:
         "answer": "Answer to the question the best you can and if you meantion anything within the video cite it with a timestamps in the format of HH:MM:SS. If you used any other resources cite them as links at the end of your message as footnotes. If unable to answer, respond with "I don't know"."`;
    const result = await getGeminiResponse([
      {
        role: "user",
        content: prompt,
      },
    ]);
    if (result.length > 0) {
      await redis.hset(
        `initial_query:${videoUrl}`,
        `prior_chats:${chatCount}`,
        `${chatquestion}:${result}`
      );
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Video chat error:", error);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
