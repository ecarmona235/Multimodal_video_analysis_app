from fastapi import FastAPI, UploadFile, File
from fastapi.background import BackgroundTasks
from video_tasks import download_and_prepare_video
from clip_search import search_video

app = FastAPI()

@app.post("/upload/")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    # Save uploaded video
    video_path = f"video_store/{file.filename}"
    with open(video_path, "wb") as f:
        f.write(await file.read())

    # Schedule background processing
    background_tasks.add_task(download_and_prepare_video, video_path)

    return {"message": "Upload received", "video_path": video_path}


@app.post("/search/")
async def search(query: str, video_path: str):
    return search_video(video_path, query)
