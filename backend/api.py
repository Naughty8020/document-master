from fastapi import FastAPI
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

# --- グローバル変数 (ファイル操作用) ---
prs = None
filepath = None

# --- Pydanticモデル (API用) ---
class SlideUpdate(BaseModel):
    index: int
    text: str

class TextToTranslate(BaseModel):
    text: str # 翻訳したいテキストを受け取る

# --- ユーティリティ関数 ---
def update_text_keep_layout(shape, text):
    if shape.has_text_frame:
        shape.text_frame.clear()
        shape.text_frame.text = text

# ----------------------------------------------------
# FastAPI エンドポイント
# ----------------------------------------------------

@app.get("/get_file")
async def load_file():
    # ... (既存の /get_file ロジックは省略) ...
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

    if ext == ".pptx":
        prs = Presentation(path)
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
    """
    スライドのテキストを更新し、PPTXファイルを保存します。
    クライアントから送られたテキストを改行で分割し、シェイプごとに割り当てます。
    """
    global prs, filepath
    
    if prs is None:
        return {"error": "PPT ファイルが読み込まれていません"}

    slide = prs.slides[data.index]
    
    # 🚨 修正ロジック 🚨
    # クライアントから送られたテキストを、改行で分割する
    # これは、フロントエンドがテキストを \n で結合して送ってきたことを前提としています。
    new_texts = data.text.split('\n')
    text_index = 0

    # テキスト更新
    for shape in slide.shapes:
        if shape.has_text_frame:
            # 新しいテキスト配列から順番にテキストを取り出して更新する
            if text_index < len(new_texts):
                text_to_write = new_texts[text_index]
                update_text_keep_layout(shape, text_to_write)
                text_index += 1
            else:
                # テキストが不足している場合は空にする (オプション)
                update_text_keep_layout(shape, "") 

    # --- PowerPoint を閉じる --- (Mac環境の強制終了処理)
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

@app.post("/translate_text")
async def api_translate_text(data: TextToTranslate):
    """
    指定されたテキストをFuguMTモデルで翻訳し、結果を返します。
    """
    if TRANS_MODEL is None:
        # 翻訳モデルがロードされていない場合、エラーを返す前にログに出力
        print("🔴 ERROR: 翻訳モデル (TRANS_MODEL) がロードされていません。")
        return {"error": "翻訳モデルがロードされていません", "translated_text": data.text}
    
    # 🚨 ログ出力 1: 翻訳前の入力テキスト
    print(f"▶️ IN: 翻訳入力テキスト: {data.text}")
    
    # 翻訳ロジック関数を呼び出す
    translated_text = translate_text(data.text)
    
    # 🚨 ログ出力 2: 翻訳後の出力テキスト
    print(f"◀️ OUT: 翻訳結果テキスト: {translated_text}")
    
    return {"status": "ok", "translated_text": translated_text}