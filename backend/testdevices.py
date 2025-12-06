from transformers import AutoTokenizer
from optimum.intel import OVModelForSeq2SeqLM
import re


class TranslatorModel:
    def __init__(self, model_dir="openvino_model", src_lang="ja_XX", tgt_lang="en_XX"):

        # Tokenizer 読み込み
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

        # OpenVINO モデル読み込み
        self.model = OVModelForSeq2SeqLM.from_pretrained(
            model_dir,
            device="CPU",
            compile=True
        )

        # 言語設定
        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.tokenizer.src_lang = src_lang
        self.forced_bos_token_id = self.tokenizer.lang_code_to_id[tgt_lang]

    def translate_text(self, text: str):
        if not text.strip():
            return ""

        text = re.sub(r'\n{2,}', '\n', text.strip())
        inputs = self.tokenizer(text, return_tensors="pt",
                                truncation=True, max_length=256)

        outputs = self.model.generate(
            **inputs,
            max_length=256,
            forced_bos_token_id=self.forced_bos_token_id,

            do_sample=True,          # ★ サンプリングを有効にする
            temperature=0.4,         # ★ ランダム性を制御 (0.7は適度な多様性)
            top_k=50,
        )

        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)


# translator_model.py の下の方に追記

if __name__ == "__main__":
    translator = TranslatorModel(model_dir="openvino_model")

    test_texts = [
        "今日は良い天気です。",
        "私は学生です。",
        "このコードはOpenVINOで推論するために最適化されています。"
    ]

    for text in test_texts:
        result = translator.translate_text(text)
        print(f"日本語: {text}")
        print(f"英語: {result}")
        print("---")
