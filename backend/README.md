uv run main.py

uv add

uv sync




uvicorn api:app --reload
optimum-cli export openvino --model Helsinki-NLP/opus-mt-ja-en ov_opusmt_ja_en
