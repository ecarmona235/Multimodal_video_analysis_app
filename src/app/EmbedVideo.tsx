import { YouTubeEmbed } from "@next/third-parties/google";
import React, { useEffect } from "react";
import { getYouTubeVideoIdFromUrl } from "@/utils/youtube";
import { useState } from "react";

interface OptimizedYouTubeEmbedProps {
  videoUrl: string; // Accepts the full YouTube video URL
  startTime?: number;
  width?: string | number;
  height?: string | number;
}

export function OptimizedYouTubeEmbed({
  videoUrl,
  startTime,
  width,
  height,
  ...rest
}: OptimizedYouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [embedParams, setEmbedParams] = useState<string>("");
  useEffect(() => {
    const id = getYouTubeVideoIdFromUrl(videoUrl);
    setVideoId(id);
  }, [videoUrl]); // Re-run effect when URL changes

  useEffect(() => {
    // Update embed parameters when startTime changes
    let params = "";
    if (startTime !== undefined) {
      params = `start=${startTime}`;
    }
    setEmbedParams(params); // Update the state with new parameters
  }, [startTime]);
  if (!videoId) {
    return <div>Invalid YouTube URL or video ID not found.</div>;
  }

  return (
    <YouTubeEmbed
      videoid={videoId} // Pass the extracted ID to the optimized component
      width={typeof width === "string" ? Number(width) || undefined : width}
      height={typeof height === "string" ? Number(height) || undefined : height}
      params={embedParams} // Pass the constructed parameters string
      {...rest} // Pass any other props down to YouTubeEmbed
    />
  );
}
