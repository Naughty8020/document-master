from optimum.intel.openvino import OVModelForSeq2SeqLM
from transformers import MarianTokenizer 

# --- 設定 ---
MODEL_ID = "staka/fugumt-ja-en"
OV_MODEL_PATH = "ov_fugumt_ja_en" 
text = "これはOpenVINOの推論を試すためのテスト文章です。"
target_token = ">>en<<"
# -------------

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

# 4. トークナイズ
inputs = tokenizer(text, return_tensors="pt") 

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
