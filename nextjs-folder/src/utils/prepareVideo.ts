export function downloadVideoInBackground(videoUrl: string) {
  void fetch("http://localhost:8000/process_youtube/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoUrl }),
  }).catch(err => {
    console.error("Video download and processing error", err);
  });
}
