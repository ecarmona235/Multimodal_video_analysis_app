import yt_dlp
import cv2
import json
from pathlib import Path
import traceback

FRAME_DIR_BASE = Path("video_store")

def extract_frames_from_youtube(youtube_url: str):
    try:
        # Setup download directory
        video_dir = FRAME_DIR_BASE / "downloads"
        video_dir.mkdir(parents=True, exist_ok=True)
        output_template = str(video_dir / "%(id)s.%(ext)s")

        ydl_opts = {
            'format': 'mp4',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
        }

        # Download video using yt_dlp
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            video_id = info.get('id')
            ext = info.get('ext', 'mp4')

        video_path = video_dir / f"{video_id}.{ext}"
        print(f"Downloaded video to {video_path}")

        # Open video for frame extraction
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video {video_path}")

        basename = video_path.stem
        frame_dir = FRAME_DIR_BASE / f"frames_{basename}"
        frame_dir.mkdir(parents=True, exist_ok=True)

        fps = cap.get(cv2.CAP_PROP_FPS)
        timestamps = {}

        frame_num = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_file = frame_dir / f"frame_{frame_num:05d}.jpg"
            cv2.imwrite(str(frame_file), frame)

            # Save timestamp for frame
            timestamps[str(frame_file.name)] = frame_num / fps

            frame_num += 1

        cap.release()

        # Save timestamps to JSON
        with open(frame_dir / "timestamps.json", "w") as f:
            json.dump(timestamps, f)

        # Delete downloaded video file after processing
        video_path.unlink()
        print(f"Deleted downloaded video: {video_path}")


    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()

        
