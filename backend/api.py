# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pptx import Presentation
import tkinter as tk
from tkinter import filedialog
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_texts_from_ppt(path: str):
    prs = Presentation(path)
    slide_texts = []

    for slide in prs.slides:
        text = []
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text.append(shape.text)
        slide_texts.append("\n".join(text))

    return slide_texts


@app.get("/get_ppt")
async def load_ppt():
    root = tk.Tk()
    root.withdraw()

    path = filedialog.askopenfilename(
        title="PPTを選択",
        filetypes=[("PowerPoint", "*.pptx")]
    )

    if not path:
        return {"error": "ファイルが選択されていません"}

    # ファイル名だけ取得
    filename = os.path.basename(path)

    slides_text = extract_texts_from_ppt(path)

    return {
        "path": path,
        "filename": filename,  # ← 追加
        "slides": [
            {
                "index": i + 1,
                "text": slide_text
            }
            for i, slide_text in enumerate(slides_text)
        ]
    }
