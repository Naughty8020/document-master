FROM python:3.10-slim

# OS パッケージ
RUN apt-get update && \
    apt-get install -y python3-tk build-essential curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# uv インストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app

# プロジェクトコピー
COPY . .

COPY requirements.txt .
RUN uv pip install --system -r requirements.txt



CMD ["uv", "run", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
