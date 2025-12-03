cd .\backend\

# プロジェクトディレクトリで
python -m venv .venv_new

# PowerShellでactive
.venv_new\Scripts\Activate.ps1

# 仮想環境がactiveの状態でrequirements.txtからダウウンロード
pip install -r requirements.txt

python.exe -m pip install --upgrade pip

# openvinoをダウウンロード
pip install optimum[openvino]
pip install --upgrade optimum[openvino] optimum-intel


# モデルダウンロード・量子化
optimum-cli export openvino --model facebook/mbart-large-50-many-to-many-mmt --task translation --weight-format int8 openvino_model


# 実行
uvicorn api:app --reload

# モデルのテスト実行
python testdevices.py




# uv環境

uv run main.py

uv add

uv remove

uv pip

uv sync


uv run uvicorn api:app --reload



別モデル
optimum-cli export openvino --model Helsinki-NLP/opus-mt-ja-en ov_opusmt_ja_en

