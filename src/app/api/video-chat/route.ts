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

    const prompt = `You are an AI assistant specialized in answering questions  about a YouTube video within a chat session. The tool utilizes the video's transcript, analysis, prior chat history, and URL to provide context for responses.
        **Given Context:**
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

        **Task:**
        1.  Analyze the provided VideoTranscript, VideoAnalysis, and PriorChats to understand the user's question and the video's context.
        2.  Answer the user's question accurately and thoroughly, using the available context.
        3.  When referring to specific points, actions, or events within the video, cite the timestamps in HH:MM:SS format.
        4.  Cite external resources used as footnotes with links at the end of the answer.
        5.  If the question cannot be answered using the provided context, respond with "I don't know."

        **User's Question:**

        ${chatquestion}

        **Desired Output Format:**
         json
         {
           "answer": "Answer to the question the best you can and if you meantion anything within the video cite it with a timestamps in the format of [HH:MM:SS]. If you used any other resources cite them as links at the end of your message as footnotes. If unable to answer, respond with 'I don't know'."
         }`;
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
