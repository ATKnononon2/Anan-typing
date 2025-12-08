# Pythonのバージョンを指定
FROM python:3.10

# 作業ディレクトリを作成
WORKDIR /app

# 必要なファイルをコンテナ内にコピー
COPY requirements.txt .
COPY app.py .
COPY templates ./templates

# ライブラリをインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリを起動 (ホスト0.0.0.0で公開)
CMD ["python", "app.py"]