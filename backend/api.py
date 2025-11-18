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
    """フォントの色 (RGB) を文字列で取得します。"""
    try:
        if font_color and font_color.rgb:
            return str(font_color.rgb)
    except:
        return None
    return None


def close_all_powerpoint_presentations_mac(save_changes=False):
    """
    🚨 Mac専用機能 🚨
    Mac上でAppleScriptを使って、現在開いている全てのPowerPointプレゼンテーションを閉じます。
    
    Args:
        save_changes (bool): 
            True: 変更を保存してから閉じます。
            False: 保存せずに閉じます（未保存の変更は破棄されます）。
    """
    if platform.system() != "Darwin":
        print("⚠️ 警告: Mac環境ではないため、PowerPointを閉じる操作はスキップされました。")
        return

    if save_changes:
        # 変更を保存して閉じるためのAppleScript
        script_command = """
        tell application "Microsoft PowerPoint"
            # 開いているプレゼンテーションを全て閉じる (保存して閉じる)
            close every presentation saving yes
        end tell
        """
        print("✨ [Mac] PowerPointの全てのプレゼンテーションを、保存して閉じます...")
    else:
        # 変更を保存せずに閉じるためのAppleScript (savedプロパティをtrueに設定して強制的に閉じる)
        script_command = """
        tell application "Microsoft PowerPoint"
            try
                set allPresentations to presentations
                
                repeat with i from (count of allPresentations) to 1 by -1
                    set aPresentation to item i of allPresentations
                    
                    # 変更がされていても保存を促さないようにSavedプロパティをtrueに設定
                    set saved of aPresentation to true
                    
                    # プレゼンテーションを閉じる
                    close aPresentation
                end repeat
            on error errMsg
                log "AppleScriptエラー: " & errMsg
            end try
        end tell
        """
        print("✨ [Mac] PowerPointの全てのプレゼンテーションを、保存せずに閉じます...")
        
    try:
        # PythonからAppleScriptを実行します
        subprocess.run(['osascript', '-e', script_command], check=True, capture_output=True, text=True)
        print("✅ [Mac] PowerPointの閉じる処理が完了しました。")

    except subprocess.CalledProcessError as e:
        print(f"🚨 [Mac] AppleScriptの実行中にエラーが発生しました: {e.stderr.strip()}")
    except FileNotFoundError:
        # osascriptが見つからないのは通常ありえませんが、念のため
        print("🚨 'osascript' コマンドが見つかりません。")

# ----------------------------------------------------
# /get_file
# ----------------------------------------------------
@app.get("/get_file")
async def load_file():
    global prs, filepath

    # tkinterはGUIアプリなので、サーバー環境によっては非推奨です
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
        # ファイルを開く
        prs = Presentation(path)

        # デスクトップでファイルを開く（GUI操作）
        if platform.system() == "Darwin":
            subprocess.run(["open", path])
        elif platform.system() == "Windows":
            # Windowsの場合、win32comを使用する方が確実ですが、ここではos.startfileを使用
            os.startfile(path) 

        # データ抽出ロジック
        for i, slide in enumerate(prs.slides):
            slide_shapes = []

            for shape_index, shape in enumerate(slide.shapes): # shape_indexを追加
                shape_data = {
                    "shape_index": shape_index, # shape_indexをデータに含める
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
        prs = None # Wordファイルの場合はPowerPointオブジェクトをNoneにする
        doc = Document(path)
        paragraphs = [p.text for p in doc.paragraphs]
        slides = [{"index": i, "shapes": [{"text": t}]} for i, t in enumerate(paragraphs)]

    else:
        return {"error": f"{ext}形式は未対応です"}

    return {"path": path, "filename": filename, "slides": slides, "ext": ext}

# ----------------------------------------------------
# /translate_text (翻訳モデルがないため、このAPIは機能しない可能性があります)
# ----------------------------------------------------
@app.post("/translate_text")
async def api_translate_text(data: TextToTranslate):

    translate_text(slides)  # モデルがロードされているか確認するためのダミー呼び出し
 
    print(f"⚠️ 翻訳モデルが未定義です。入力テキストをそのまま返します: {data.text}")
    return {"status": "ok", "translated_text": data.text}

# ----------------------------------------------------
# /update_slide
# ----------------------------------------------------
@app.post("/update_slide")
def update_slide(data: SlidesPayload):
    global prs, filepath
    if prs is None:
        # prsがNoneの場合、ファイルを再ロードする（グローバル変数の状態がリセットされた場合を想定）
        prs = Presentation(filepath) 

    for slide_item in data.slides:
        slide = prs.slides[slide_item.slide_index]
        for shape_item in slide_item.shapes:
            shape = slide.shapes[shape_item.shape_index]
            if shape.has_text_frame:
                # この実装はシェイプ全体のテキストを置き換えます
                shape.text = shape_item.translated_text

    # update_slideでは保存しない（savefileでまとめて保存する想定）
    # prs.save(filepath) 
    return {"status": "ok"}

# ----------------------------------------------------
# /test (シェイプの座標取得)
# ----------------------------------------------------
@app.post("/test")
def test_endpoint(payload: dict = Body(...)):
    selectedFilePath = payload.get("selectedFilePath")
    prs = Presentation(selectedFilePath)
    slides_info = [] # 結果を返すために追加

    for slide_index, slide in enumerate(prs.slides):
        print(f"--- Slide {slide_index + 1} ---")
        shapes_info = []
        for shape_index, shape in enumerate(slide.shapes):
            print(f"Shape {shape_index + 1}:")
            print(f"  Left: {shape.left}, Top: {shape.top}")
            print(f"  Width: {shape.width}, Height: {shape.height}")
            
            # 結果を返すために情報を収集
            shapes_info.append({
                "shape_index": shape_index,
                "left": shape.left,
                "top": shape.top,
                "width": shape.width,
                "height": shape.height
            })
            
        slides_info.append({"slide_index": slide_index, "shapes": shapes_info})

    return {"status": "ok", "slides": slides_info}


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


# ----------------------------------------------------
# /savefile (ユーザーの要望通り、閉じる処理を残す)
# ----------------------------------------------------
@app.post("/savefile")
def savefile_endpoint(payload: dict = Body(...)):
    global prs, filepath
    if prs is None or filepath is None:
        return {"error": "保存するファイルがありません。ファイルを先にロードしてください。"}

    slides_data = payload.get("slides", [])

    # --- メモリ上のprsオブジェクトを編集 ---
    for slide_item in slides_data:
        try:
            slide = prs.slides[slide_item["slide_index"]]
        except IndexError:
            continue # スライドインデックスが不正ならスキップ

        for shape_item in slide_item["shapes"]:
            try:
                shape = slide.shapes[shape_item["shape_index"]]
            except IndexError:
                continue # シェイプインデックスが不正ならスキップ

            if not shape.has_text_frame:
                continue

            tf = shape.text_frame

            # ---- 部分的 paragraph 置換 ----
            if "paragraphs" in shape_item:
                for p_item in shape_item["paragraphs"]:
                    p_index = p_item.get("paragraph_index")
                    new_text = p_item.get("text", "")

                    # index が範囲外なら無視
                    if p_index is None or p_index >= len(tf.paragraphs):
                        continue

                    para = tf.paragraphs[p_index]
                    para.clear()    # ※中の runs をクリア
                    para.text = new_text

            # paragraphs が無い → 元の段落すべて維持 (処理なし)
            else:
                pass
    
    # --- 🚨 Mac環境のみでPowerPointを閉じる処理 🚨 ---
    # 【重要】prs.save() が成功するためには、この行は技術的には不要ですが、
    # ユーザーのデスクトップで開いているGUIアプリを閉じるために実行します。
    # 以下の呼び出しは、Macのローカル環境でのみ動作します。
    close_all_powerpoint_presentations_mac(save_changes=False) 

    # --- ファイルをディスクに保存 ---
    # python-pptxによる保存処理は、アプリが閉じられていても実行されます。
    prs.save(filepath)
    
    return {"status": "ok", "message": f"ファイルを保存し、PowerPointアプリケーションを閉じました。"}

from pydantic import BaseModel
from pptx.util import Inches, Pt

class TextData(BaseModel):
    text: str
    left: float
    top: float
    width: float
    height: float

    

@app.post("/insert")
def insert_slide(data: TextData):
    global prs, filepath

    try:
        # 💡 修正点2: tryブロック内の処理を正しくインデント
        print("インサートのパス",filepath)
        print(data.left,data.top,data.width,data.height) 

        slide = prs.slides[0]
        
        # 座標とサイズを Inches で指定 (例として左上から2インチ、幅4インチなど)
        left = Inches(data.left) 
        top = Inches(data.top)  
        width = Inches(data.width)
        height = Inches(data.height)

        # left = Inches(7) 
        # top = Inches(5)  
        # width = Inches(4)
        # height = Inches(5)
        
        # 指定した座標とサイズでテキストボックスを追加
        txBox = slide.shapes.add_textbox(left, top, width, height)
        tf = txBox.text_frame
        
        # 受信したテキストを挿入
        p = tf.paragraphs[0]
        p.text = data.text
        # ファイルが見つかった場合の処理をここに続ける
        print(f"ファイル 'input.pptx' を開きました。")
        print(f"受け取ったテキスト: {data.text}")

        prs.save(filepath)
        print(f"テキストボックスを追加し、ファイルを保存しました。")
        
        # 実際のPPTX処理 (例: スライドにテキストを追加するコードなど) はここに追加します
        # 例: slide = prs.slides[0]; ...
        
    except FileNotFoundError:
        # 💡 修正点3: exceptブロック内の処理を正しくインデント
        print("input.pptx が見つかりません。ファイルを作成してください。")
        
        # ファイルが見つからない場合は、エラーメッセージを返して終了する
        # FastAPIでは exit() ではなく、適切なエラーレスポンスを返すのが一般的です。
        return {"status": "error", "message": "処理に必要な 'input.pptx' ファイルが見つかりませんでした。"}
    
    # try...exceptブロックの外に出すことで、エラーが発生しなかった場合のみ実行される
    return {"status": "ok", "message": "新しいスライドを追加しました。"}


class TranslateData(BaseModel):
    text: str

@app.post("/insert-translate")
def insert_translate(data: TranslateData):
    print(data)
    print("翻訳するテキスト:", data.text)
    translated_text = translate_text(data.text)  # data.text にアクセスする
    return {
        "status": "ok",
        "message": "翻訳して挿入しました。",
        "translated_text": translated_text
    }