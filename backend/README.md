uv run main.py

uv add

uv sync

pip install optimum[openvino]
pip install --upgrade optimum[openvino] optimum-intel


uvicorn api:app --reload
optimum-cli export openvino --model Helsinki-NLP/opus-mt-ja-en ov_opusmt_ja_en


optimum-cli export openvino --model facebook/mbart-large-50-many-to-many-mmt --task translation --weight-format int8 openvino_model