from transformers import AutoTokenizer
from optimum.intel.openvino import OVModelForSeq2SeqLM
from openvino.runtime import Core

# --- 翻訳モデルの設定 ---
MODEL_NAME = "Helsinki-NLP/opus-mt-ja-en"

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
