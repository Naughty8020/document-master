# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pptx import Presentation
import tkinter as tk
from tkinter import filedialog
import os
import subprocess
import docx


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


def extract_texts_from_docx(path: str):
    from docx import Document

    doc = Document(path)
    paragraphs = [para.text for para in doc.paragraphs]
    return "\n".join(paragraphs)


@app.get("/get_file")
async def load_ppt():
    root = tk.Tk()
    root.withdraw()

    path = filedialog.askopenfilename(
    title="ファイルを選択",
    filetypes=[
        ("PowerPoint", "*.pptx"),
        ("Word", "*.docx"),
        ("PDF", "*.pdf"),
        ("すべて", "*.*")
    ]
)


    if not path:
        return {"error": "ファイルが選択されていません"}
    
    ext = os.path.splitext(path)[1].lower()

    print(ext)

    if ext == ".pptx":
           slides_text = extract_texts_from_ppt(path)

    elif ext == ".docx":slides_text = extract_texts_from_docx(path) 


    # ファイル名だけ取得
    filename = os.path.basename(path)
    subprocess.run(["open", path])

 

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
