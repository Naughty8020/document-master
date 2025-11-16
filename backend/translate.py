from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# --- 翻訳モデルの設定 ---
MODEL_NAME = "staka/fugumt-ja-en"
TRANS_MODEL = None
TRANS_TOKENIZER = None
DECODER_START_TOKEN_ID = None

# --- モデルの初期ロードと設定 ---
def load_translation_model():
    """アプリケーション起動時に一度だけモデルをロードする関数"""
    global TRANS_MODEL, TRANS_TOKENIZER, DECODER_START_TOKEN_ID

    print(f"--- 翻訳モデル {MODEL_NAME} のロード中... ---")
    try:
        TRANS_TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME)
        TRANS_MODEL = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME).eval()
        
        # 翻訳品質を確保するための設定
        TRANS_TOKENIZER.src_lang = "ja" 
        DECODER_START_TOKEN_ID = TRANS_MODEL.config.forced_bos_token_id
        if DECODER_START_TOKEN_ID is None:
            DECODER_START_TOKEN_ID = TRANS_MODEL.config.decoder_start_token_id
            
        print(f"✅ 翻訳モデル {MODEL_NAME} のロード完了")
        return True
    except Exception as e:
        print(f"❌ 翻訳モデルのロードに失敗しました。推論はできません: {e}")
        return False


def translate_text(text: str) -> str:
    """FuguMTモデルを使用して日本語から英語へ翻訳する関数"""
    global TRANS_MODEL, TRANS_TOKENIZER, DECODER_START_TOKEN_ID

    if TRANS_MODEL is None or not text.strip():
        return text

    # トークン化
    inputs = TRANS_TOKENIZER(text, return_tensors="pt", max_length=512, truncation=True)
    
    # 翻訳の生成 (調整済みの設定)
    generated_ids = TRANS_MODEL.generate(
        **inputs,
        max_new_tokens=128,
        num_beams=3,
        do_sample=False,
        repetition_penalty=1.5,
        decoder_start_token_id=DECODER_START_TOKEN_ID
    )

    english_text = TRANS_TOKENIZER.decode(generated_ids.squeeze(), skip_special_tokens=True)
    return english_text

# アプリケーションがインポートされたときにモデルをロード
load_translation_model()

# translator.py が直接実行された場合のテスト (オプション)
if __name__ == "__main__":
    test_text = "一つじゃなくて二つで通信"
    print(f"\nテスト原文: {test_text}")
    result = translate_text(test_text)
    print(f"テスト翻訳結果: {result}")