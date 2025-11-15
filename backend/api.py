from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pptx import Presentation
from docx import Document
from pydantic import BaseModel
import tkinter as tk
from tkinter import filedialog
import os, subprocess, platform, time

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

prs = None
filepath = None

class SlideUpdate(BaseModel):
    index: int
    text: str

def update_text_keep_layout(shape, text):
    # 単純置き換え（元のフォント・レイアウト保持）
    if shape.has_text_frame:
        shape.text_frame.clear()
        shape.text_frame.text = text

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
    filepath = path

    slides = []

    # PPTX
    if ext == ".pptx":
        prs = Presentation(path)

        # macOSなら開く
        if platform.system() == "Darwin":
            subprocess.run(["open", path])
        elif platform.system() == "Windows":
            os.startfile(path)

        for i, slide in enumerate(prs.slides):
            text = []
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text.append(shape.text)
            slides.append({"index": i, "text": "\n".join(text)})

    # DOCX
    elif ext == ".docx":
        prs = None
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

@app.post("/update_slide")
def update_slide(data: SlideUpdate):
    global prs, filepath

    if prs is None:
        return {"error": "PPT ファイルが読み込まれていません"}

    slide = prs.slides[data.index]

    # テキスト更新
    for shape in slide.shapes:
        update_text_keep_layout(shape, data.text)

    # --- PowerPoint を閉じる ---
    subprocess.run([
        "osascript", "-e",
        'tell application "Microsoft PowerPoint" to quit'
    ], check=False)

    time.sleep(1)

    # --- 念のため残党 kill ---
    for proc in ["Microsoft PowerPoint", "PowerPoint Rendering", "PowerPoint Presenter", "PowerPoint"]:
        subprocess.run(["killall", "-9", proc], check=False)

    # 保存
    prs.save(filepath)

    # 参照解放＆再読み込み
    prs = None
    prs = Presentation(filepath)

    # 再オープン
    subprocess.run(["open", filepath])

    return {"status": "ok", "index": data.index}
