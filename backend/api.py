from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pptx import Presentation
from docx import Document
from pydantic import BaseModel
import tkinter as tk
from tkinter import filedialog
import os, subprocess, platform, time
from translate import translate_text, TRANS_MODEL

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- グローバル変数 ---
prs = None
filepath = None

# --- Pydantic Models ---
class TextToTranslate(BaseModel):
    text: str

class ShapeUpdate(BaseModel):
    shape_index: int
    translated_text: str

class SlideUpdateShapes(BaseModel):
    slide_index: int
    shapes: list[ShapeUpdate]

class SlidesPayload(BaseModel):
    slides: list[SlideUpdateShapes]

# --- Util ---
def get_color(font_color):
    try:
        if font_color and font_color.rgb:
            return str(font_color.rgb)
    except:
        return None
    return None


# ----------------------------------------------------
# /get_file
# ----------------------------------------------------
@app.get("/get_file")
async def load_file():
    global prs, filepath

    root = tk.Tk()
    root.withdraw()
    path = filedialog.askopenfilename(
        title="ファイルを選択",
        filetypes=[("PowerPoint", "*.pptx"), ("Word", "*.docx"), ("すべて", "*.*")]
    )

    if not path:
        return {"error": "ファイルが選択されていません"}

    filepath = path
    filename = os.path.basename(path)
    ext = os.path.splitext(path)[1].lower()
    slides = []

    if ext == ".pptx":
        prs = Presentation(path)

        if platform.system() == "Darwin":
            subprocess.run(["open", path])
        elif platform.system() == "Windows":
            os.startfile(path)

        for i, slide in enumerate(prs.slides):
            slide_shapes = []

            for shape in slide.shapes:
                shape_data = {
                    "left": shape.left if hasattr(shape, "left") else None,
                    "top": shape.top if hasattr(shape, "top") else None,
                    "width": shape.width if hasattr(shape, "width") else None,
                    "height": shape.height if hasattr(shape, "height") else None,
                    "paragraphs": []
                }

                if shape.has_text_frame:
                    tf = shape.text_frame
                    print(shape.text)

                    for p_index, paragraph in enumerate(tf.paragraphs):
                        paragraph_data = {
                            "paragraph_index": p_index,
                            "text": paragraph.text,
                            "runs": []
                        }

                        for r_index, run in enumerate(paragraph.runs):
                            paragraph_data["runs"].append({
                                "run_index": r_index,
                                "text": run.text,
                                "bold": run.font.bold,
                                "italic": run.font.italic,
                                "size": run.font.size.pt if run.font.size else None,
                                "color": get_color(run.font.color)
                            })

                        shape_data["paragraphs"].append(paragraph_data)

                slide_shapes.append(shape_data)

            slides.append({"index": i, "shapes": slide_shapes})
            print(slide_shapes)

    elif ext == ".docx":
        prs = None
        doc = Document(path)
        paragraphs = [p.text for p in doc.paragraphs]
        slides = [{"index": i, "shapes": [{"text": t}]} for i, t in enumerate(paragraphs)]

    else:
        return {"error": f"{ext}形式は未対応です"}

    return {"path": path, "filename": filename, "slides": slides, "ext": ext}

# ----------------------------------------------------
# /translate_text
# ----------------------------------------------------
@app.post("/translate_text")
async def api_translate_text(data: TextToTranslate):
    if TRANS_MODEL is None:
        return {"error": "翻訳モデルがロードされていません", "translated_text": data.text}
    translated = translate_text(data.text)
    return {"status": "ok", "translated_text": translated}

# ----------------------------------------------------
# /update_slide
# ----------------------------------------------------
@app.post("/update_slide")
def update_slide(data: SlidesPayload):
    global prs, filepath
    if prs is None:
        prs = Presentation(filepath)

    for slide_item in data.slides:
        slide = prs.slides[slide_item.slide_index]
        for shape_item in slide_item.shapes:
            shape = slide.shapes[shape_item.shape_index]
            if shape.has_text_frame:
                shape.text = shape_item.translated_text

    prs.save(filepath)
    return {"status": "ok"}

# ----------------------------------------------------
# /test (シェイプの座標取得)
# ----------------------------------------------------
@app.post("/test")
def test_endpoint(payload: dict = Body(...)):
    selectedFilePath = payload.get("selectedFilePath")
    prs = Presentation(selectedFilePath)
    for slide_index, slide in enumerate(prs.slides):
        print(f"--- Slide {slide_index + 1} ---")
        for shape_index, shape in enumerate(slide.shapes):
            print(f"Shape {shape_index + 1}:")
            print(f"  Left: {shape.left}, Top: {shape.top}")
            print(f"  Width: {shape.width}, Height: {shape.height}")
    return {"status": "ok"}




@app.post("/savetest")
def save_test_endpoint(payload: dict = Body(...)):
    selectedFilePath = payload.get("selectedFilePath")

    prs = Presentation(selectedFilePath)

    # ---- 位置情報抽出 ----
    slides_info = []

    for slide_index, slide in enumerate(prs.slides):
        shapes_info = []

        for shape_index, shape in enumerate(slide.shapes):
            # テキスト有無チェック
            text = shape.text if shape.has_text_frame else ""

            shapes_info.append({
                "shape_index": shape_index,
                "left": shape.left,       # X座標
                "top": shape.top,         # Y座標
                "width": shape.width,
                "height": shape.height,
                "text": text
            })

        slides_info.append({
            "slide_index": slide_index,
            "shapes": shapes_info
        })

    # ---- 保存処理 ----
    test_save_path = os.path.splitext(selectedFilePath)[0] + "_test.pptx"
    prs.save(test_save_path)

    return {
        "status": "ok",
        "saved_path": test_save_path,
        "slides": slides_info
    }


