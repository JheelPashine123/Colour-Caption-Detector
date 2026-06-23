# 🎨 Image Colour & Caption Generator

## 🚀 Overview

Image Colour & Caption Generator is a web-based application that combines AI-powered image understanding with image processing techniques to generate meaningful image captions and extract dominant color palettes from uploaded images.

The application provides quick visual insights by automatically describing image content and identifying the most prominent colors present in the image.

---

# ✨ Features

* 🖼️ Generate AI-powered captions from uploaded images
* 🎨 Extract dominant color palettes from images
* ✍️ Generate context-aware image descriptions
* ⚡ Fast and responsive web interface
* 📋 Copy generated captions instantly
* 🎨 Copy HEX color codes with ease

---

# 🤖 AI Model

## BLIP (Bootstrapping Language–Image Pre-training)

This project uses the pretrained **BLIP** model for image caption generation, enabling accurate and context-aware image descriptions without additional model training.

---

# 🎨 Color Extraction

Dominant colors are extracted directly from uploaded images using image processing techniques.

## Color Analysis Features

* Extracts the most prominent colors
* Generates HEX color codes
* Creates a compact color palette representation
* Works with a wide variety of image types

No additional dataset or model training is required for color extraction.

---

# 🛠️ Tech Stack

## Frontend

* React

## Backend

* Python

## AI & Machine Learning

* BLIP
* Transformers
* PyTorch

## Image Processing

* Pillow
* OpenCV
* NumPy

---

# ⚙️ How It Works

1. Upload an image
2. The BLIP model generates a descriptive caption
3. Image processing algorithms analyze color distribution
4. Dominant colors are extracted
5. Captions and HEX color palettes are displayed to the user

---

# 📦 Installation & Setup

## Option 1: Run with Docker Compose (Recommended)

Make sure Docker Desktop is installed and running before using this option.

```bash
git clone https://github.com/JheelPashine123/Colour-Caption-Detector.git
cd Colour-Caption-Detector
```

Start the full application with one command:

```bash
docker compose up --build
```

Open the application:

```text
http://localhost:3000
```

The backend API runs on:

```text
http://localhost:8000
```

To stop the application:

```bash
docker compose down
```

> The first Docker run can take time because the backend installs the AI/ML dependencies and downloads the BLIP model.
> If `docker compose` is not found, install Docker Desktop first and restart your terminal.

---

## Option 2: Run Manually

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/JheelPashine123/Colour-Caption-Detector.git
cd Colour-Caption-Detector
```

### 2️⃣ Create and Activate the BLIP Environment

```bash
conda create -n blip_env python=3.10 -y
conda activate blip_env
pip install --upgrade pip
```

Install the main BLIP dependencies:

```bash
pip install torch torchvision transformers pillow
```

### 3️⃣ Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4️⃣ Install and Start the Frontend

Open a new terminal and run:

```bash
cd frontend
npm install
npm start
```

### 5️⃣ Open the Application

Visit:

```text
http://localhost:3000
```

Upload an image and generate:

* 🖼️ AI-powered captions
* 🎨 Dominant color palettes
* 📋 HEX color codes

When you are finished, deactivate the Conda environment:

```bash
conda deactivate
```

---

## Docker Project Structure

```text
backend/Dockerfile      -> Backend FastAPI container
frontend/Dockerfile     -> Frontend React container
docker-compose.yml      -> Runs both services together
```
---

# 🌍 Live Demo

🔗 **Demo Link:** https://github.com/JheelPashine123/Colour-Caption-Detector/issues/1#issue-3814739455


---

# 👨‍💻 Author

Developed by **Jheel Pashine**
