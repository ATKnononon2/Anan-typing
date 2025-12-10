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
app.secret_key = 'random_secret_key_for_session'

# ==========================================
# 🛑 設定エリア
# ==========================================
GOOGLE_CLIENT_ID = "615786165928-5j6gjs46idi14kgqvcu6r6qkugi9f739.apps.googleusercontent.com"
CODESPACES_URL = "https://ominous-guacamole-g476wxpvr7pgfwx6r-5000.app.github.dev"
ALLOWED_DOMAIN = "it-mirai-h.ibk.ed.jp"

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
    email = db.Column(db.String(120), nullable=False)   # メールアドレス
    accuracy = db.Column(db.Float, nullable=False)      # 正誤率
    tps = db.Column(db.Float, nullable=False)           # TPS
    correct_strokes = db.Column(db.Integer, nullable=False) # 正打数
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
                # テーブル構造変更時は以下をコメントアウト解除してリセット
                # db.drop_all()
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
        return redirect(url_for('game'))
    
    login_uri = f"{CODESPACES_URL}/login/callback"
    return render_template("index.html", client_id=GOOGLE_CLIENT_ID, domain=ALLOWED_DOMAIN, login_uri=login_uri)

@app.route("/game")
def game():
    user = session.get('user_info')
    if not user:
        return redirect(url_for('index'))
    return render_template("anan.html", user=user)

@app.route("/login/callback", methods=['POST'])
def login_callback():
    token = request.form.get('credential')
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        email = id_info['email']
        domain_hd = id_info.get('hd') 

        # ドメインチェック (簡易版)
        if domain_hd != ALLOWED_DOMAIN and not email.endswith('@' + ALLOWED_DOMAIN):
             return f"エラー: @{ALLOWED_DOMAIN} のアカウントのみ許可されています。", 403

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
        all_rankings = Ranking.query.order_by(
            Ranking.correct_strokes.desc(),
            Ranking.tps.desc(),
            Ranking.accuracy.desc(),
            Ranking.timestamp.asc()
        ).limit(10).all()
        return jsonify([r.to_dict() for r in all_rankings]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rankings', methods=['POST'])
def add_ranking():
    user_info = session.get('user_info')
    if not user_info:
        return jsonify({"error": "Unauthorized"}), 401
    
    email = user_info['email']
    data = request.json
    
    try:
        new_ranking = Ranking(
            email=email,
            accuracy=float(data['accuracy']),
            tps=float(data['tps']),
            correct_strokes=int(data['correct_strokes'])
        )
        db.session.add(new_ranking)
        db.session.commit()
        
        # 追加後の最新ランキングを返す
        return get_rankings()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)