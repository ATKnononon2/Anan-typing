# 必須モジュールのインポート
import os       # OSモジュールのインポート
import secrets  # セキュリティ関連のモジュールのインポート


# ==========================================
# 🔐 基本設定 / セキュリティ
# ==========================================
# 環境変数があればそれを使い、なければランダム生成
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(16))
# デバッグモードの設定
FLASK_DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'


# ==========================================
# 🗄️ データベース設定
# ==========================================
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'rootpassword')
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'db')
MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'my_flask_db')

# SQLAlchemy用URI
SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}'
SQLALCHEMY_TRACK_MODIFICATIONS = False


# ==========================================
# 🌐 Google OAuth / URL設定
# ==========================================
GOOGLE_CLIENT_ID = "615786165928-5j6gjs46idi14kgqvcu6r6qkugi9f739.apps.googleusercontent.com"
CODESPACES_URL = "https://squalid-poltergeist-wrgxjv4q5jq6299xg-5000.app.github.dev"
LOGIN_URI = f"{CODESPACES_URL}/login"


# ==========================================
# 👮‍♂️ 権限・許可リスト
# ==========================================
# ログイン自体を許可するドメイン
ALLOWED_DOMAINS = [
    "it-mirai-h.ibk.ed.jp",
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]

# 管理者用に許可するメールアドレス
ALLOWED_EMAILS = [
    ""
]


# 以下先生 (teachers.html) 用に許可するドメイン
KEY_ALLOWED_SUFFIXES = [
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]

# 管理者用に許可するメールアドレス
KEY_ALLOWED_EMAILS = [
    ""
]