# Pythonのバージョンを指定
FROM python:3.10

# ログがバッファされずにすぐ表示されるように設定
ENV PYTHONUNBUFFERED=1

# 作業ディレクトリを作成
WORKDIR /app

# 先に requirements.txt だけをコピー
# ビルド時間を短縮する為に依存関係を先に定義
COPY requirements.txt .

# ソースコードを入れる前にインストール
RUN pip install --no-cache-dir -r requirements.txt

# インストールが終わってから、ソースコード類をコピー
COPY app.py settings.py ./
COPY templates ./templates
COPY static ./static

# ポート5000を開放することを明示
EXPOSE 5000

# アプリを起動
CMD ["python", "app.py"]