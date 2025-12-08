from transformers import AutoTokenizer
from optimum.intel import OVModelForSeq2SeqLM
import re


class TranslatorModel:
    def __init__(self, model_dir="openvino_model"):
        # Tokenizer 読み込み
        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

        # OpenVINO モデル読み込み
        self.model = OVModelForSeq2SeqLM.from_pretrained(
            model_dir,
            device="CPU",
            compile=True
        )

    def translate_text(self, text: str, src_lang="ja_XX", tgt_lang="en_XX"):
        """
        翻訳方向を指定してテキストを翻訳
        """
        if not text.strip():
            return ""

        # 改行整理
        text = re.sub(r'\n{2,}', '\n', text.strip())

        # 言語設定
        self.tokenizer.src_lang = src_lang
        forced_bos_token_id = self.tokenizer.lang_code_to_id[tgt_lang]

        # Tokenize
        inputs = self.tokenizer(text, return_tensors="pt",
                                truncation=True, max_length=256)

        # 推論
        outputs = self.model.generate(
            **inputs,
            max_length=256,
            forced_bos_token_id=forced_bos_token_id,
            do_sample=True,
            temperature=0.4,
            top_k=50,
        )

        # デコード
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)


# 使い方例
if __name__ == "__main__":
    translator = TranslatorModel(model_dir="openvino_model")

    texts = [
        "今日は良い天気です。",
        "I am a student.",
        "このコードはOpenVINOで推論するために最適化されています。"
    ]

    for text in texts:
        # 日本語 → 英語
        result_en = translator.translate_text(
            text, src_lang="ja_XX", tgt_lang="en_XX")
        print(f"JA → EN: {result_en}")

        # 英語 → 日本語
        result_ja = translator.translate_text(
            text, src_lang="en_XX", tgt_lang="ja_XX")
        print(f"EN → JA: {result_ja}")
        print("---")
