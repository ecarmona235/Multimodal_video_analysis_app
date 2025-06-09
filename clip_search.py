import torch
import clip
from PIL import Image
import os
from pathlib import Path
import json

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def search_video(video_path: Path, query: str) ->  dict[str]:

    print("starting.. looking up frames")
    basename = video_path.stem
    frame_dir = video_path.parent.parent / f"frames_{basename}"
 

    # Load timestamps map
    with open(frame_dir / "timestamps.json", "r") as f:
        timestamps = json.load(f)
    
    print("Finished loading timestamps")

    text = clip.tokenize([query]).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text)
        text_features /= text_features.norm(dim=-1, keepdim=True)

        results = []
        print("scanning ... ")

        for fname in sorted(os.listdir(frame_dir)):
            if not fname.endswith(".jpg"):
                continue

            image_path = frame_dir / fname
            image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)

            image_features = model.encode_image(image)
            image_features /= image_features.norm(dim=-1, keepdim=True)

            similarity = (image_features @ text_features.T).item()
            results.append({
                "frame": fname,
                "timestamp": timestamps.get(fname, None),
                "score": similarity,
            })

        # Sort results descending by similarity score
        results.sort(key=lambda x: x["score"], reverse=True)
        print("Returning...")

        # Return top 5 matches with frame, timestamp, score
        return results[0]