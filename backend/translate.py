<<<<<<< HEAD
from optimum.intel.openvino import OVModelForSeq2SeqLM
from transformers import MarianTokenizer 
=======
from transformers import AutoTokenizer
from optimum.intel.openvino import OVModelForSeq2SeqLM
from openvino.runtime import Core
>>>>>>> cbb6591cdb62334f1961ca0e26903eb4261e6db1

# --- 設定 ---
MODEL_ID = "staka/fugumt-ja-en"
OV_MODEL_PATH = "ov_fugumt_ja_en" 
text = "これはOpenVINOの推論を試すためのテスト文章です。"
target_token = ">>en<<"
# -------------

<<<<<<< HEAD
# 1. トークナイザーのロード
tokenizer = MarianTokenizer.from_pretrained(MODEL_ID)

# 2. OpenVINO IR 翻訳モデルのロード
print("--- OpenVINO IR モデルをロード中... ---")
# library_name 引数を含む辞書を明示的に渡し、ライブラリ名とローカルパスのみに限定します。
# 以前のコードと違い、引数を一つの辞書として渡しています。
ov_model = OVModelForSeq2SeqLM.from_pretrained(
    OV_MODEL_PATH, 
    library_name="transformers" # 必ずこの行があることを確認！
)

# 3. トークンIDの取得
forced_bos_id = tokenizer.convert_tokens_to_ids(target_token)
pad_token_id = tokenizer.pad_token_id
eos_token_id = tokenizer.eos_token_id
=======
TRANS_MODEL = None
TRANS_TOKENIZER = None
DECODER_START_TOKEN_ID = None

# OpenVINO デバイス指定（CPU / GPU / AUTO）
DEVICE = "AUTO"


# --- モデルの初期ロード ---
def load_translation_model():
    global TRANS_MODEL, TRANS_TOKENIZER, DECODER_START_TOKEN_ID

    print(f"--- OpenVINO 翻訳モデル {MODEL_NAME} の最適化＆ロード中... ---")

    try:
        # Tokenizer は普通にHFから取得
        TRANS_TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME)

        # 🔥 OpenVINO が自動で IR 変換＆コンパイルしてロード
        TRANS_MODEL = OVModelForSeq2SeqLM.from_pretrained(
            MODEL_NAME,
            export=True,          # ← 初回のみ IR に変換（キャッシュされる）
            device=DEVICE
        )

        # decoder_start_token_id 取得
        DECODER_START_TOKEN_ID = TRANS_MODEL.config.forced_bos_token_id \
                                 or TRANS_MODEL.config.decoder_start_token_id

        print(f"✅ OpenVINO 翻訳モデルのロード完了")
        return True

    except Exception as e:
        print(f"❌ OpenVINO 翻訳モデルのロード失敗: {e}")
        return False
>>>>>>> cbb6591cdb62334f1961ca0e26903eb4261e6db1

# 4. トークナイズ
inputs = tokenizer(text, return_tensors="pt") 

<<<<<<< HEAD
print("--- 翻訳を生成中... ---")

# 5. generate() 呼び出しとデコーディングパラメータの設定
generated_ids = ov_model.generate(
    **inputs, 
    max_length=100, 
    num_beams=4,                 
    early_stopping=True,         
    repetition_penalty=2.0,       
    
    # 安定化のための必須パラメータ
    forced_bos_token_id=forced_bos_id,
    pad_token_id=pad_token_id,
    eos_token_id=eos_token_id,
) 

# 6. 生成されたIDをテキストにデコード
translation = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

print(f"\n元の日本語: {text}")
print(f"翻訳結果 (英語): {translation}")
=======
# --- 推論 ---
def translate_text(text: str) -> str:
    global TRANS_MODEL, TRANS_TOKENIZER, DECODER_START_TOKEN_ID

    if TRANS_MODEL is None or not text.strip():
        return text

    inputs = TRANS_TOKENIZER(text, return_tensors="pt")

    # 🔥 ここが OpenVINO 推論
    outputs = TRANS_MODEL.generate(
        **inputs,
        max_new_tokens=128,
        num_beams=3,
        do_sample=False,
        repetition_penalty=1.5,
        decoder_start_token_id=DECODER_START_TOKEN_ID
    )

    english_text = TRANS_TOKENIZER.decode(outputs[0], skip_special_tokens=True)
    return english_text


# アプリケーション読み込み時にモデルロード
load_translation_model()


# テスト
if __name__ == "__main__":
    text = "一つじゃなくて二つで通信"
    print(translate_text(text))
>>>>>>> cbb6591cdb62334f1961ca0e26903eb4261e6db1
