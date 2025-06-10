import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("starting search request")
  console.log(body.videoId);
  console.log(body.searchQuery);
  const res = await fetch("http://localhost:8000/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: body.searchQuery, video_id: body.videoId }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to video-image-search" },
      { status: 500 }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
