# 必須モジュールのインポート
import os       #
import time     #
import datetime #
import logging  #
import secrets  #

# Flask関連モジュールのインポート
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from google.oauth2 import id_token
from google.auth.transport import requests

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
# ★セキュリティ対策: 環境変数があればそれを使い、なければランダム生成
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# ==========================================
# 🛑 設定エリア
# ==========================================
GOOGLE_CLIENT_ID = "615786165928-5j6gjs46idi14kgqvcu6r6qkugi9f739.apps.googleusercontent.com"
CODESPACES_URL = "https://squalid-poltergeist-wrgxjv4q5jq6299xg-5000.app.github.dev"

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

# ==========================================
# 🛑 管理者・先生 (Teachers.html) 用の許可リスト
# ==========================================
# ここに含まれるメールアドレス、またはドメインを持つ人は /Anan-Only に飛ばします
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

# app.py の該当部分を書き換え

# データベース設定
# 環境変数から個別に取得（なければデフォルト値を使うが、パスワードは空にしないこと）
db_user = os.environ.get('MYSQL_USER', 'root')
db_password = os.environ.get('MYSQL_PASSWORD', 'rootpassword') # ★ここを後でDocker側で上書きします
db_host = os.environ.get('MYSQL_HOST', 'db')
db_name = os.environ.get('MYSQL_DATABASE', 'my_flask_db')

# 接続用URIを組み立てる
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'

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
    # 既にログイン済みなら、適切なページへ飛ばす
    if 'user_info' in session:
        email = session['user_info']['email']
        # ここでも権限チェックをして振り分けるのがベスト
        is_teacher = False
        if email in KEY_ALLOWED_EMAILS:
            is_teacher = True
        else:
            for suffix in KEY_ALLOWED_SUFFIXES:
                if email.endswith(suffix):
                    is_teacher = True
                    break
        
        if is_teacher:
            return redirect(url_for('Anan_page'))
        else:
            return redirect(url_for('game'))
    
    login_uri = f"{CODESPACES_URL}/login/callback"
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
        return render_template("Teachers.html", user=user)
    else:
        # 権限がないのにアクセスした場合のエラー処理
        return "このページにアクセスする権限がありません。", 403

@app.route("/login/callback", methods=['POST'])
def login_callback():
    token = request.form.get('credential')
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # 表記ゆれ防止
        email = id_info['email'].strip().lower()
        domain_hd = id_info.get('hd') 

        # --- ログ出力 ---
        print(f"★判定ログ: アクセスアドレス -> {email}")
        
        # --- ログイン許可判定 ---
        is_allowed_login = False
        allowed_emails_lower = [e.strip().lower() for e in ALLOWED_EMAILS]
        
        # 1. 個別メール許可
        if email in allowed_emails_lower:
            is_allowed_login = True
        # 2. 組織ドメイン(hd)許可
        elif domain_hd in ALLOWED_DOMAINS:
            is_allowed_login = True
        # 3. メールアドレス末尾許可
        else:
            for domain in ALLOWED_DOMAINS:
                if email.endswith('@' + domain):
                    is_allowed_login = True
                    break
        
        if not is_allowed_login:
             print("★判定ログ: ログイン拒否されました")
             return f"エラー: このアカウント({email})は許可されていません。管理者にお問い合わせください。", 403

        # ユーザー情報の保存・更新
        name = id_info.get('name')
        picture = id_info.get('picture')

        user = User.query.filter_by(email=email).first()
        if not user:
            new_user = User(email=email, name=name, picture=picture)
            db.session.add(new_user)
            db.session.commit()
        
        session['user_info'] = {'email': email, 'name': name, 'picture': picture}
        
        # =================================================
        # ★ここが修正ポイント: ユーザー権限による振り分け
        # =================================================
        is_teacher = False

        # 1. 先生リストに含まれているか
        if email in KEY_ALLOWED_EMAILS:
            is_teacher = True
        else:
            # 2. 先生用ドメイン(suffix)に含まれているか
            for suffix in KEY_ALLOWED_SUFFIXES:
                if email.endswith(suffix):
                    is_teacher = True
                    break
        
        if is_teacher:
            print(f"★振分ログ: {email} -> Teachers.html")
            return redirect(url_for('Anan_page'))
        else:
            print(f"★振分ログ: {email} -> Students.html")
            return redirect(url_for('game'))
        # =================================================

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
        # 1. 全取得してソート
        all_records = Ranking.query.order_by(
            Ranking.correct_strokes.desc(),
            Ranking.tps.desc(),
            Ranking.accuracy.desc(),
            Ranking.timestamp.asc()
        ).all()

        unique_rankings = []
        seen_emails = set()

        # 2. 重複除外
        for record in all_records:
            if record.email not in seen_emails:
                unique_rankings.append(record.to_dict())
                seen_emails.add(record.email)
        
        # 3. 自分の順位検索
        user_info = session.get('user_info')
        my_rank_data = None
        
        if user_info:
            my_email = user_info['email']
            for index, r in enumerate(unique_rankings):
                if r['email'] == my_email:
                    my_rank_data = r
                    my_rank_data['rank'] = index + 1
                    break

        # 4. トップ300まで返却
        return jsonify({
            "ranking_list": unique_rankings[:300],
            "my_rank": my_rank_data
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rankings', methods=['POST'])
def add_ranking():
    user_info = session.get('user_info')
    if not user_info:
        return jsonify({"error": "ログインが必要です"}), 401

    try:
        data = request.json

        # --- ★追加: 数値の検証（バリデーション） ---
        accuracy = float(data.get('accuracy', 0))
        tps = float(data.get('tps', 0))
        correct_strokes = int(data.get('correct_strokes', 0))

        # 1. 正答率が 0%未満 または 100%超え はおかしい
        if not (0 <= accuracy <= 100):
            return jsonify({"error": "不正な正答率です"}), 400

        # 2. TPSが 30回/秒 を超えるのは人間にはほぼ不可能（世界記録でも20程度）
        if tps > 30:
            return jsonify({"error": "異常な入力速度です"}), 400

        # 3. 入力数が極端に多い場合も弾く（ゲーム時間などによるが、一旦上限を設ける）
        if correct_strokes > 5000:
             return jsonify({"error": "異常な入力数です"}), 400
        
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
    is_debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(debug=is_debug, host='0.0.0.0', port=5000)