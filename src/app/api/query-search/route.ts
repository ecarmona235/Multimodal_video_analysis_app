import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/utils/geminiClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchQuestion = body.searchQuestion || "";

    console.log("search question:", searchQuestion);
    const prompt = `You are an AI assistant specialized in analysis of user question to extract search queries related to the content of a video.

        **Task:**

        1. Extract the minimal amount keywords from the user's question need to be able to do a search query matching to the content of the video frames by another function

        **User's Question:**

        "${searchQuestion}"

        **Desired Output Format:**

        json
        {
            "searchQuery": "keyword1 keyword2 keywordN"  // no spaces before the first keyword and no spaces after the last keyword. 
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
