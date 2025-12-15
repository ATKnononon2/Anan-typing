import os
import time
import datetime
import logging
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from google.oauth2 import id_token
from google.auth.transport import requests

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
# ★セキュリティ対策: 環境変数があればそれを使い、なければランダム生成
import secrets
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# ==========================================
# 🛑 設定エリア
# ==========================================
GOOGLE_CLIENT_ID = "615786165928-5j6gjs46idi14kgqvcu6r6qkugi9f739.apps.googleusercontent.com"
CODESPACES_URL = "https://squalid-poltergeist-wrgxjv4q5jq6299xg-5000.app.github.dev"

ALLOWED_DOMAINS = [
    "it-mirai-h.ibk.ed.jp",
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]

ALLOWED_EMAILS = [
    "amtptjx@gmail.com"
]

# ==========================================
# 🛑 ded.html 専用の許可リスト
# ==========================================
KEY_ALLOWED_EMAILS = [
    "amtptjx@gmail.com"
]
KEY_ALLOWED_SUFFIXES = [
    "mail.ibk.ed.jp",
    "blue.ibk.ed.jp",
    "green.ibk.ed.jp",
    "yellow.ibk.ed.jp",
    "post.ibk.ed.jp"
]

# データベース設定
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'SQLALCHEMY_DATABASE_URI', 
    'mysql+pymysql://root:rootpassword@db/my_flask_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 
db = SQLAlchemy(app)

# ==========================================
# 🛑 モデル定義
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=True)
    picture = db.Column(db.String(255), nullable=True)

class Ranking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    tps = db.Column(db.Float, nullable=False)
    correct_strokes = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'email': self.email,
            'correct_strokes': self.correct_strokes,
            'tps': self.tps,
            'accuracy': self.accuracy,
            'date': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') 
        }

# ==========================================
# 🛑 DB初期化
# ==========================================
def init_db():
    retries = 30
    while retries > 0:
        try:
            with app.app_context():
                db.create_all()
                print("✅ データベース接続成功")
                return 
        except Exception as e:
            retries -= 1
            print(f"⏳ DB接続待機中... {retries}")
            time.sleep(2)

# ==========================================
# 🛑 ルーティング
# ==========================================
@app.route("/")
def index():
    if 'user_info' in session:
        # ★修正: url_forには「関数名(game)」を指定します
        return redirect(url_for('game'))
    
    login_uri = f"{CODESPACES_URL}/login/callback"
    # ★修正: ALLOWED_DOMAIN ではなく ALLOWED_DOMAINS を渡します（または削除してもOK）
    return render_template("AnanIndex.html", client_id=GOOGLE_CLIENT_ID, domain=ALLOWED_DOMAINS, login_uri=login_uri)

@app.route("/Anan-Typing")
def game():
    user = session.get('user_info')
    if not user:
        return redirect(url_for('index'))
    return render_template("Students.html", user=user)

@app.route("/Anan-Only")
def Anan_page():
    user = session.get('user_info')
    if not user:
        return redirect(url_for('index'))

    email = user['email']
    is_allowed = False

    if email in KEY_ALLOWED_EMAILS:
        is_allowed = True
    else:
        for suffix in KEY_ALLOWED_SUFFIXES:
            if email.endswith(suffix):
                is_allowed = True
                break

    if is_allowed:
        return render_template("Teaches.html", user=user)
    else:
        return "このページにアクセスする権限がありません。", 403

@app.route("/login/callback", methods=['POST'])
def login_callback():
    token = request.form.get('credential')
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # ★修正1: 空白除去(.strip) と 小文字化(.lower) で表記ゆれを防止
        email = id_info['email'].strip().lower()
        domain_hd = id_info.get('hd') 

        # --- デバッグ用ログ出力（ターミナルを見てください） ---
        print(f"★判定ログ: アクセスアドレス -> {email}")
        print(f"★判定ログ: 許可リスト中身 -> {ALLOWED_EMAILS}")
        # --------------------------------------------------

        is_allowed = False

        # 【チェック1】個別に許可されたメールアドレスリストに入っているか？
        # ★修正2: リスト側も小文字にして比較する（念の為）
        allowed_emails_lower = [e.strip().lower() for e in ALLOWED_EMAILS]
        
        if email in allowed_emails_lower:
            print("★判定ログ: 個別メールリストで許可されました")
            is_allowed = True
            
        # 【チェック2】許可されたドメイン（組織）に所属しているか？
        elif domain_hd in ALLOWED_DOMAINS:
            print("★判定ログ: 組織ドメイン(hd)で許可されました")
            is_allowed = True
            
        # 【チェック3】ドメイン情報(hd)がない場合、メアドの末尾が許可ドメインか？
        else:
            for domain in ALLOWED_DOMAINS:
                if email.endswith('@' + domain):
                    print(f"★判定ログ: ドメイン末尾(@{domain})で許可されました")
                    is_allowed = True
                    break
        
        if not is_allowed:
             print("★判定ログ: 拒否されました")
             return f"エラー: このアカウント({email})は許可されていません。管理者にお問い合わせください。", 403

        name = id_info.get('name')
        picture = id_info.get('picture')

        user = User.query.filter_by(email=email).first()
        if not user:
            new_user = User(email=email, name=name, picture=picture)
            db.session.add(new_user)
            db.session.commit()
        
        session['user_info'] = {'email': email, 'name': name, 'picture': picture}
        
        return redirect(url_for('game'))

    except ValueError as e:
        print(f"★認証エラー発生: {e}")
        return f"認証エラー: {e}", 400

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('index'))

# ==========================================
# 🛑 API (ランキング)
# ==========================================
@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    try:
        all_records = Ranking.query.order_by(
            Ranking.correct_strokes.desc(),
            Ranking.tps.desc(),
            Ranking.accuracy.desc(),
            Ranking.timestamp.asc()
        ).all()

        unique_rankings = []
        seen_emails = set()

        for record in all_records:
            if record.email not in seen_emails:
                unique_rankings.append(record.to_dict())
                seen_emails.add(record.email)
            
            if len(unique_rankings) >= 10:
                break

        return jsonify(unique_rankings), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rankings', methods=['POST'])
def add_ranking():
    user_info = session.get('user_info')
    if not user_info:
        return jsonify({"error": "ログインが必要です"}), 401

    try:
        data = request.json
        new_ranking = Ranking(
            email=user_info['email'],
            accuracy=data['accuracy'],
            tps=data['tps'],
            correct_strokes=data['correct_strokes']
        )
        db.session.add(new_ranking)
        db.session.commit()
        return jsonify({"message": "ランキング保存成功", "data": new_ranking.to_dict()}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    # 本番運用時は debug=False にしましょう
    is_debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=is_debug, host='0.0.0.0', port=5000)