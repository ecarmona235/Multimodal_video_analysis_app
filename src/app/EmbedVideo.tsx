import { YouTubeEmbed } from "@next/third-parties/google";
import React, { use, useEffect, useRef } from "react";
import { getYouTubeVideoIdFromUrl } from "@/utils/youtube";
import { useState } from "react";


interface OptimizedYouTubeEmbedProps {
  videoUrl: string; // Accepts the full YouTube video URL
  startTime?: number;
  width?: string | number;
  height?: string | number;
  autoPlay?: number; // Optional prop to control autoplay
}

export function OptimizedYouTubeEmbed({
  videoUrl,
  startTime=0,
  width,
  height,
  ...rest
}: OptimizedYouTubeEmbedProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const playerRef = useRef<any>(null); // Ref to hold the YouTube player instance
  const [autoPlay, setAutoPlay] = useState(0); // State to manage autoplay
  useEffect(() => {
    const id = getYouTubeVideoIdFromUrl(videoUrl);
    setVideoId(id);
  }, [videoUrl]); // Re-run effect when URL changes
  useEffect(() => {
    setAutoPlay(1); // Set autoplay to 1 to play the video after seeking
    seekTo(startTime); // Seek to startTime when the component mounts or startTime changes
    
  }, [startTime]); // Re-run effect when startTime changes}
  useEffect(() => {
    // This effect loads the YouTube IFrame Player API
    // It only runs once when the component mounts
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0]; // Use index 0 to get the first script tag
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      // API is ready, you can now create a player instance
      if (videoId) {
        playerRef.current = new (window as any).YT.Player("youtube-player", {
          // 'youtube-player' should match the iframe ID
          videoId: videoId,
          playerVars: {
            autoplay: 0, // Use the autoPlay prop or default to 0
            enablejsapi: 1, // Crucial for API interaction
          },
          events: {
            onReady: onPlayerReady,
          },
        });
      }
    };

    return () => {
      // Clean up the player instance when the component unmounts
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]); // Re-run effect when videoId changes to create a new player

  // Function to seek to a specific time and play
  const seekTo = (seconds: number) => {
    console.log(`Seeking to ${seconds} seconds`);
    if (playerRef.current && playerRef.current.seekTo) {
      setAutoPlay(1); // Set autoplay to 1 to play the video after seeking
      playerRef.current.seekTo(seconds, true); // seekTo(seconds, allowSeekAhead)
    }
  };

  const onPlayerReady = (event: any) => {
    // The player is ready. You can now use the seekTo function.
    // If you want to initially seek to startTime, you can call seekTo(startTime) here
    if (startTime !== undefined) {
      seekTo(startTime);
    }
  };

  if (!videoId) {
    return <div>Invalid YouTube URL or video ID not found.</div>;
  }

  return (
    <div>
      {/* Render the iframe with the ID */}
      {videoId && (
        <iframe
          id="youtube-player" // Assign a unique ID to the iframe
          width={width || 560}
          height={height || 315}
          // The src will be constructed by the YouTubeEmbed component.
          // ensure 'enablejsapi=1' is included in the params prop if you use it for other parameters.
          // If not using params for anything else, you can explicitly add it to the src here:
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${autoPlay}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
}
