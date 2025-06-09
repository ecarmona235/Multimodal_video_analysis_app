from fastapi import FastAPI, Query
from fastapi.background import BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from video_tasks import extract_frames_from_youtube
from clip_search import search_video
from pathlib import Path

app = FastAPI()

class YouTubeRequest(BaseModel):
    videoUrl: str

class SearchRequest(BaseModel):
    query: str
    video_id: str
    
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/process_youtube/")
async def process_youtube_video(request: YouTubeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(extract_frames_from_youtube, request.videoUrl)
    return {"message": "Video download and frame extraction started", "url": request.videoUrl}



@app.post("/search")
async def search(request: SearchRequest):
    print(request.video_id)
    video_path = Path(f"video_store/downloads/{request.video_id}.mp4")
    timestapsList = search_video(video_path, request.query)
    print(timestapsList['timestamp'])
    return {"timestamp" : timestapsList['timestamp']}


@app.get("/check-file")
def check_file(file_name: str = Query(..., description="File name to check")):
    file_path = Path(file_name)
    if file_path.exists():
        return {"exists": True}
    return JSONResponse(content={"exists": False}, status_code=404)