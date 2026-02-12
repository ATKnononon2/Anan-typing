# 必須モジュールのインポート
import os       # OSモジュールのインポート
import time     # 時間の計測や待機を行うモジュール
import datetime # 日付と時刻を扱うモジュール
import logging  # ログ出力を行うモジュール
import secrets  # セキュリティ関連のモジュールのインポート

# Flask関連モジュールのインポート
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from google.oauth2 import id_token
from google.auth.transport import requests


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
# ログイン自体を許可するドメイン/アドレス
ALLOWED_DOMAINS = [
    "it-mirai-h.ibk.ed.jp",
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]

ALLOWED_EMAILS = [
    ""
]

# 管理者・先生 (Teachers.html) 用の許可リスト
KEY_ALLOWED_EMAILS = [
    ""
]

KEY_ALLOWED_SUFFIXES = [
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]