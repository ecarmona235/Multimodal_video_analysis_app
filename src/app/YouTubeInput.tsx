"use client";

import { useState } from "react";

export function YouTubeInput() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState("");

  const handleSubmit = async () => { 
    setIsLoading(true)
    const response = await fetch("/api/video-analysis", {
      method: "POST",
      body: JSON.stringify({videoUrl}),
    });
    setIsLoading(false);
    const data = await response.json();
    setSummary(data.result);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="youtube-url"
            className="block text-sm font-medium text-zinc-300 mb-2"
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
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          onClick={handleSubmit}
        > 
          {isLoading ? "Analyzing,please wait.." : "Analyze Video"}
        </button>
        {isLoading && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animated-spin rounded-full border-4 border-zinc-300 border-t-blue-600"/>
          </div>
        )}
        {summary && (
          <div className="mt-4 p-4 bg-zinc-900 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              Summay
            </h3>
            <p className="text-zinc-400">{summary}</p>
            </div>
        )}
      </div>
    </div>
  );
}
