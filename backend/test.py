# from optimum.intel.openvino import OVModelForSeq2SeqLM
# from transformers import MarianTokenizer 

# # --- 設定 ---
# MODEL_ID = "Helsinki-NLP/opus-mt-ja-en"
# OV_MODEL_PATH = "ov_opusmt_ja_en"  # ← ここを変更
# text = "これはOpenVINOの推論を試すためのテスト文章です。"
# target_token = None  # opus-mt は >>en<< を使わない
# # --------------

# # 1. トークナイザー
# tokenizer = MarianTokenizer.from_pretrained(MODEL_ID)

# # 2. OpenVINO IR モデルロード
# print("--- OpenVINO IR モデルをロード中... ---")
# ov_model = OVModelForSeq2SeqLM.from_pretrained(
#     OV_MODEL_PATH,
#     library_name="transformers",
#     export=False
# )

# # トークンID取得
# pad_token_id = tokenizer.pad_token_id
# eos_token_id = tokenizer.eos_token_id

# # モデルの設定を強制
# ov_model.config.pad_token_id = pad_token_id
# ov_model.config.eos_token_id = eos_token_id

# # 3. トークナイズ
# inputs = tokenizer(text, return_tensors="pt")

# print("--- 翻訳を生成中... ---")

# # 4. generate()
# generated_ids = ov_model.generate(
#     **inputs,
#     max_length=100,
#     num_beams=5,
#     early_stopping=True,
#     repetition_penalty=1.2,
#     pad_token_id=pad_token_id,
#     eos_token_id=eos_token_id,
# )

# # 5. デコード
# translation = tokenizer.batch_decode(
#     generated_ids, 
#     skip_special_tokens=True
# )[0]

# print("\n元の日本語:", text)
# print("翻訳結果 (英語):", translation)
