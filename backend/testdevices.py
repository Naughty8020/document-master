# translator_model.py
from transformers import AutoTokenizer
from optimum.intel.openvino import OVModelForSeq2SeqLM
import re

class TranslatorModel:
    def __init__(self, model_dir="openvino_model", src_lang="ja_XX", tgt_lang="en_XX"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        self.model = OVModelForSeq2SeqLM.from_pretrained(model_dir, device="CPU")

        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.tokenizer.src_lang = src_lang
        self.forced_bos_token_id = self.tokenizer.lang_code_to_id[tgt_lang]

    def translate_text(self, text: str):
        if not text.strip():
            return ""
        text = re.sub(r'\n{2,}', '\n', text.strip())
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
        outputs = self.model.generate(**inputs, max_length=256, forced_bos_token_id=self.forced_bos_token_id)
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)


# --- ファイル単体でテスト実行する場合 ---
if __name__ == "__main__":
    translator = TranslatorModel(model_dir="openvino_model")
    test_texts = [
        "今日は良い天気です。",
        "私は学生です。",
        "このコードはOpenVINOで推論するために最適化されています。"
    ]
    for text in test_texts:
        result = translator.translate_text(text)
        print(f"日本語: {text}\n英語: {result}\n---")
