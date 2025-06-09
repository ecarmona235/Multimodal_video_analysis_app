import React, { useEffect, useId, useRef, useState } from "react";
import { getYouTubeVideoIdFromUrl } from "@/utils/youtube";

interface OptimizedYouTubeEmbedProps {
  videoUrl: string;
  startTime?: number;
  width?: string | number;
  height?: string | number;
  autoPlay?: number;
  startOnTime?: boolean;
}

export function IframeYouTubeEmbed({
  videoUrl,
  startTime,
  width,
  height,
  startOnTime,
}: OptimizedYouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const uniqueId = useId(); // unique per component
  const playerDivId = `youtube-player-${uniqueId}`;

  // Load video ID from URL
  useEffect(() => {
    const id = getYouTubeVideoIdFromUrl(videoUrl);
    setVideoId(id);
  }, [videoUrl]);

  // Load the YouTube API script (once)
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else if (videoId) {
      createPlayer();
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      if (videoId) createPlayer();
    };

    function createPlayer() {
      playerRef.current = new (window as any).YT.Player(playerDivId, {
        videoId,
        playerVars: {
          autoplay: startOnTime ? 1 : 0,
          start: startTime || 0,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
        },
      });
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [videoId, startTime]);

  const onPlayerReady = () => {
    if (typeof startTime === "number") {
      playerRef.current.seekTo(startTime, true);
    }
  };

  if (!videoId) {
    return <div>Invalid YouTube URL or video ID not found.</div>;
  }

  return (
    <div>
      <div
        id={playerDivId}
        style={{ width: width || 560, height: height || 315 }}
      />
    </div>
  );
}
