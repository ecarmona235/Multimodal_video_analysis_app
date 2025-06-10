"use client";

import React from "react";
import { useState } from "react";
import { IframeYouTubeEmbed } from "./EmbedVideo";
import { downloadVideoInBackground } from "@/utils/prepareVideo";
import { checkIfFileExists } from "@/utils/check_file";
import { getYouTubeVideoIdFromUrl } from "@/utils/youtube";

interface Topic {
  timestamp: string;
  topic: string;
}

export function YouTubeInput() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [startingTime, setStartingTime] = useState<number>(0);
  const [chatCount, setChatCount] = useState(0);
  const [chatQuestion, setChatQuestion] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [searchQuery, setSearchQueries] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    const response = await fetch("/api/video-analysis", {
      method: "POST",
      body: JSON.stringify({ videoUrl }),
    });

    setIsLoading(false);
    const data = await response.json();
    const parsedData = data ? JSON.parse(data).topics : undefined;
    if (parsedData) { // need error handling when topics returns [] as it does when transcript fails
      setTopics(parsedData);
      const id = getYouTubeVideoIdFromUrl(videoUrl);
      console.log(id)
      setStartTime(0)
      if (id) {
        setVideoId(id);
        const exist = await checkIfFileExists(`video_store/frames_${id}`); 
        if (exist === false) {
          downloadVideoInBackground(videoUrl);
        }
      }
      
    }
  };

  const handleChats = async () => {
    setIsChatLoading(true);
    const response = await fetch("/api/video-chat", {
      method: "POST",
      body: JSON.stringify({ videoUrl, chatQuestion, chatCount }),
    });
    setIsChatLoading(false);
    setChatCount(chatCount + 1);
    const data = await response.json();
    const parsedData = data ? JSON.parse(data).answer : undefined;
    if (parsedData) {
      setAnswer(parsedData);
    }
  };

  const handleSearch = async () => {
    setIsSearchLoading(true);
    setStartingTime(0)
    const response = await fetch("/api/query-search", {
      method: "POST",
      body: JSON.stringify({ videoUrl, searchQuestion }),
    });
    const data = await response.json();
    console.log("initial data", data);
    const parsedData = data ? JSON.parse(data).searchQuery : "";
    if (parsedData !== "") {
      setSearchQueries(parsedData);
    }
    if (searchQuery != "") {
      const response = await fetch("/api/video-image-search", {
        method: "POST",
        body: JSON.stringify({ videoId, searchQuery: searchQuery }),
      });
      const data = await response.json();
      console.log("In search: ", data)
      const firstKey = Object.keys(data)[0];
      setStartingTime(data[firstKey]);

    }
    setIsSearchLoading(false);
  };

  const handleInlineCLicks = (timeStamp: string) => {
    const cleanTime = timeStamp.replace(/[^\d:]/g, ""); // removes everything except digits and colons
    const parts = cleanTime.split(":").map(Number).reverse();
    const seconds =
      (parts[0] || 0) + (parts[1] || 0) * 60 + (parts[2] || 0) * 3600;
    setStartTime(seconds);
    
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="youtube-url"
            className="text-lg font-semibold text-zinc-300 mb-2"
          >
            YouTube Video URL
          </label>
          <input
            id="youtube-url"
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button
          type="button"
          disabled={!videoUrl.trim()}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          onClick={handleSubmit}
        >
          {isLoading ? "Analyzing,please wait.." : "Analyze Video"}
        </button>
        {isLoading && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
          </div>
        )}
        {topics?.length > 0 && (
          <div className="flex flex-col overflow-y-auto p-4 rounded-lg">
            <div className="mb-4 p-4">
              <IframeYouTubeEmbed
                videoUrl={videoUrl}
                width="100%"
                height="500px"
                startTime={startTime}
                startOnTime={false}
              />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-300">
                Video Topics Timeline
              </h3>
            </div>
            <div className="space-y-3">
              {topics?.map((item, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <button
                    type="button"
                    className="px-2 py-1 bg-zinc-800 rounded text-zinc-300 font-mono hover:bg-blue-700"
                    onClick={() => handleInlineCLicks(item.timestamp)}
                  >
                    {item.timestamp}
                  </button>
                  <span className="text-zinc-400">{item.topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topics?.length > 0 && (
          <div className="flex flex-col overflow-y-auto  p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                Video Chat
              </h3>
            </div>
            <div className="chat-input-container flex h-50 overflow-y-auto p-4 rounded-full mb-2">
              <textarea
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={chatQuestion}
                onChange={e => setChatQuestion(e.target.value)}
                placeholder="Type your question..."
              />
              <button
                onClick={handleChats}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full ml-2"
              >
                Send
              </button>
            </div>
            {isChatLoading && (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
              </div>
            )}
            {answer?.length > 0 && (
              <div>
                {answer.split(" ").map((line) => {
                  if (line.match(/\[\d{2}:\d{2}:\d{2}\]/g)) {
                    return (
                      <button
                        onClick={() => handleInlineCLicks(line)}
                        className="bg-blue-500 hover:bg-blue-300 font-bold py-1 px-1 rounded-full ml-2"
                      >
                        {line}
                      </button>
                    );
                  }

                  return ` ${line} `;
                })}
              </div>
            )}
          </div>
        )}
        {topics?.length > 0 && (
          <div className="flex flex-col overflow-y-auto p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                Visual Video Search
              </h3>
            </div>
            <div className="chat-input-container flex h-50 overflow-y-auto p-4 rounded-full">
              <textarea
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-zinc-500 p4"
                value={searchQuestion}
                onChange={e => setSearchQuestion(e.target.value)}
                placeholder="Type your search question..."
                id={`search_${videoId}`}
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-6 rounded-full ml-2"
            >
              Search
            </button>
            {isSearchLoading && (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
              </div>
            )}
            {startingTime > 0 && (
              <div>
                <div className="overflow-hidden mb-4 p-4">
                  <IframeYouTubeEmbed
                    videoUrl={videoUrl}
                    startTime={167.125}
                    width="100%"
                    height="500px"
                    autoPlay={0}
                    startOnTime={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
