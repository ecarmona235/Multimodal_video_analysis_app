from fastapi import FastAPI
from fastapi.background import BackgroundTasks
from pydantic import BaseModel
from video_tasks import extract_frames_from_youtube
from clip_search import search_video
from pathlib import Path

app = FastAPI()

class YouTubeRequest(BaseModel):
    url: str

class SearchRequest(BaseModel):
    query: str
    video_id: str

@app.post("/process_youtube/")
async def process_youtube_video(request: YouTubeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(extract_frames_from_youtube, request.url)
    return {"message": "Video download and frame extraction started", "url": request.url}



@app.post("/search/")
async def search(request: SearchRequest):
    video_path = Path(f"video_store/downloads/{request.video_id}.mp4")
    return search_video(video_path, request.query)
