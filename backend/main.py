from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import pandas as pd
import math
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
print("Loading BLIP model...")

processor = BlipProcessor.from_pretrained(
    "Salesforce/blip-image-captioning-base"
)
model = BlipForConditionalGeneration.from_pretrained(
    "Salesforce/blip-image-captioning-base"
)

model.eval()  # inference mode

print("BLIP model loaded successfully")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CSV (this part was already correct)
index = ["color", "color_name", "hex", "R", "G", "B"]
csv = pd.read_csv("colors.csv", names=index, header=None)

# -------------------------------------------------
# 1️⃣ BASE COLOR DETECTION (HSV)
# -------------------------------------------------
def getBaseColor(R, G, B):
    pixel = np.uint8([[[R, G, B]]])
    h, s, v = cv2.cvtColor(pixel, cv2.COLOR_RGB2HSV)[0][0]

    if s < 40:
        if v < 50:
            return "Black"
        elif v > 200:
            return "White"
        else:
            return "Gray"

    if h < 10 or h >= 170:
        return "Red"
    elif h < 25:
        return "Orange"
    elif h < 35:
        return "Yellow"
    elif h < 85:
        return "Green"
    elif h < 125:
        return "Blue"
    elif h < 170:
        return "Purple"

    return "Unknown"

# -------------------------------------------------
# 2️⃣ MAP CSV COLOR NAME → BASE COLOR
# -------------------------------------------------
def mapToBase(color_name: str):
    name = color_name.lower()

    if any(k in name for k in ["red", "rose", "crimson"]):
        return "Red"
    if any(k in name for k in ["blue", "navy", "azure"]):
        return "Blue"
    if any(k in name for k in ["green", "olive"]):
        return "Green"
    if any(k in name for k in ["yellow", "gold"]):
        return "Yellow"
    if any(k in name for k in ["orange"]):
        return "Orange"
    if any(k in name for k in ["purple", "violet"]):
        return "Purple"
    if any(k in name for k in ["gray", "grey", "slate"]):
        return "Gray"
    if "black" in name:
        return "Black"
    if "white" in name:
        return "White"

    return "Other"

# -------------------------------------------------
# 3️⃣ FINAL COLOR NAME (RESTRICTED SEARCH)
# -------------------------------------------------
def getColorName(R, G, B):
    base = getBaseColor(R, G, B)

    min_dist = float("inf")
    best_name = base

    for _, row in csv.iterrows():
        if mapToBase(row["color_name"]) != base:
            continue  

        r1, g1, b1 = int(row["R"]), int(row["G"]), int(row["B"])

        d = math.sqrt(
            (R - r1)**2 +
            (G - g1)**2 +
            (B - b1)**2
        )

        if d < min_dist:
            min_dist = d
            best_name = row["color_name"]

    return best_name

def generate_caption(image_np):
    """
    image_np: RGB image as NumPy array
    """
    image_pil = Image.fromarray(image_np)

    inputs = processor(image_pil, return_tensors="pt")

    with torch.no_grad():
        output = model.generate(**inputs)

    caption = processor.decode(
        output[0], skip_special_tokens=True
    )

    return caption

# -------------------------------------------------
# API ENDPOINT
# -------------------------------------------------
@app.post("/detect-color")
async def detect_color(
    image: UploadFile,
    x: int = Form(...),
    y: int = Form(...)
):
    contents = await image.read()
    img_np = np.frombuffer(contents, np.uint8)

    img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    r, g, b = img[y, x]
    print("RGB from image:", r, g, b)

    color_name = getColorName(r, g, b)

    # -------- IMAGE CAPTION (BLIP) --------
    caption = generate_caption(img)


    return {
       "color": {
            "name": color_name,
            "r": int(r),
            "g": int(g),
            "b": int(b)
        },
        "caption": caption
    }
