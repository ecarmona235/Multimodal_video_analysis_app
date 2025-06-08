import cv2
import os
from pathlib import Path
import json

FRAME_DIR_BASE = Path("video_store")

def extract_frames(video_path: Path):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video {video_path}")

    basename = video_path.stem
    frame_dir = FRAME_DIR_BASE / f"frames_{basename}"
    frame_dir.mkdir(exist_ok=True, parents=True)

    fps = cap.get(cv2.CAP_PROP_FPS)
    timestamps = {}

    frame_num = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_file = frame_dir / f"frame_{frame_num:05d}.jpg"
        cv2.imwrite(str(frame_file), frame)

        # Calculate timestamp (seconds)
        timestamps[str(frame_file.name)] = frame_num / fps

        frame_num += 1

    cap.release()

    # Save timestamps for later use during search
    with open(frame_dir / "timestamps.json", "w") as f:
        json.dump(timestamps, f)