# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pptx import Presentation
from docx import Document
import tkinter as tk
from tkinter import filedialog
import os
import subprocess
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


prs = None
filepath = None

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
    doc = Document(path)
    paragraphs = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
    return paragraphs

@app.get("/get_file")
async def load_file():
    global prs, filepath

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
    filename = os.path.basename(path)

    # ファイルパスを保存（←これが必要）
    filepath = path

    # PPT
    if ext == ".pptx":
        prs = Presentation(path)    # ← これが絶対必要！
        slides = []
        for i, slide in enumerate(prs.slides):
            text = []
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text.append(shape.text)
            slides.append({"index": i, "text": "\n".join(text)})

    # DOCX
    elif ext == ".docx":
        prs = None  # ← docx は PPTX と違い編集しない
        doc = Document(path)
        paragraphs = [p.text for p in doc.paragraphs]
        slides = [{"index": i, "text": t} for i, t in enumerate(paragraphs)]

    else:
        return {"error": f"{ext}形式は未対応です"}

    return {
        "path": path,
        "filename": filename,
        "slides": slides,
        "ext": ext
    }





class SlideUpdate(BaseModel):
    index: int
    text: str


@app.post("/update_slide")
def update_slide(data: SlideUpdate):
    global prs, filepath

    slide = prs.slides[data.index]

    for shape in slide.shapes:
        if shape.has_text_frame:
            shape.text = data.text

    prs.save(filepath)  # 上書き保存

    return {"status": "ok", "index": data.index}



