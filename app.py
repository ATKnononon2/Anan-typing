# 設定ファイルのインポート
import settings

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# ==========================================
# ⚙️ 設定の読み込み (settings.pyを使用)
# ==========================================
app.secret_key = settings.SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = settings.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = settings.SQLALCHEMY_TRACK_MODIFICATIONS

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
        is_teacher = False
        
        # settings参照
        if email in settings.KEY_ALLOWED_EMAILS:
            is_teacher = True
        else:
            for suffix in settings.KEY_ALLOWED_SUFFIXES:
                if email.endswith(suffix):
                    is_teacher = True
                    break
        
        if is_teacher:
            return redirect(url_for('game_unranking'))
        else:
            return redirect(url_for('game_onranking'))
    
    # settings参照
    return render_template("index.html", 
                           client_id=settings.GOOGLE_CLIENT_ID, 
                           domain=settings.ALLOWED_DOMAINS, 
                           login_uri=settings.LOGIN_URI)

@app.route("/student/anan-typing")
def game_onranking():
    user = session.get('user_info')
    if not user:
        return redirect(url_for('index'))
    return render_template("students.html", user=user)

@app.route("/teacher/anan-typing")
def game_unranking():
    user = session.get('user_info')
    if not user:
        return redirect(url_for('index'))

    email = user['email']
    is_allowed = False

    # settings参照
    if email in settings.KEY_ALLOWED_EMAILS:
        is_allowed = True
    else:
        for suffix in settings.KEY_ALLOWED_SUFFIXES:
            if email.endswith(suffix):
                is_allowed = True
                break

    if is_allowed:
        return render_template("teachers.html", user=user)
    else:
        return "このページにアクセスする権限がありません。", 403

@app.route("/login", methods=['POST'])
def login_callback():
    token = request.form.get('credential')
    try:
        # settings参照
        id_info = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        
        email = id_info['email'].strip().lower()
        domain_hd = id_info.get('hd') 

        print(f"★判定ログ: アクセスアドレス -> {email}")
        
        is_allowed_login = False
        # settings参照
        allowed_emails_lower = [e.strip().lower() for e in settings.ALLOWED_EMAILS]
        
        if email in allowed_emails_lower:
            is_allowed_login = True
        # settings参照
        elif domain_hd in settings.ALLOWED_DOMAINS:
            is_allowed_login = True
        else:
            # settings参照
            for domain in settings.ALLOWED_DOMAINS:
                if email.endswith('@' + domain):
                    is_allowed_login = True
                    break
        
        if not is_allowed_login:
             print("★判定ログ: ログイン拒否されました")
             return f"エラー: このアカウント({email})は許可されていません。管理者にお問い合わせください。", 403

        name = id_info.get('name')
        picture = id_info.get('picture')

        user = User.query.filter_by(email=email).first()
        if not user:
            new_user = User(email=email, name=name, picture=picture)
            db.session.add(new_user)
            db.session.commit()
        
        session['user_info'] = {'email': email, 'name': name, 'picture': picture}
        
        is_teacher = False

        # settings参照
        if email in settings.KEY_ALLOWED_EMAILS:
            is_teacher = True
        else:
            for suffix in settings.KEY_ALLOWED_SUFFIXES:
                if email.endswith(suffix):
                    is_teacher = True
                    break
        
        if is_teacher:
            print(f"★振分ログ: {email} -> Teachers")
            return redirect(url_for('game_unranking'))
        else:
            print(f"★振分ログ: {email} -> Students")
            return redirect(url_for('game_onranking'))

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
        
        user_info = session.get('user_info')
        my_rank_data = None
        
        if user_info:
            my_email = user_info['email']
            for index, r in enumerate(unique_rankings):
                if r['email'] == my_email:
                    my_rank_data = r
                    my_rank_data['rank'] = index + 1
                    break

        return jsonify({
            "ranking_list": unique_rankings[:300],
            "my_rank": my_rank_data
        }), 200
    except Exception as e:
    # エラーが発生した場合に詳細をログに出し、空のリストを返す
        print(f"ランキング取得エラー: {e}")
        return jsonify({"error": str(e), "ranking_list": []}), 500

@app.route('/api/rankings', methods=['POST'])
def add_ranking():
    user_info = session.get('user_info')
    if not user_info:
        return jsonify({"error": "ログインが必要です"}), 401

    try:
        data = request.json

        accuracy = float(data.get('accuracy', 0))
        tps = float(data.get('tps', 0))
        correct_strokes = int(data.get('correct_strokes', 0))

        if not (0 <= accuracy <= 100):
            return jsonify({"error": "不正な正答率です"}), 400
        if tps > 30:
            return jsonify({"error": "異常な入力速度です"}), 400
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
    # settings参照
    app.run(debug=settings.FLASK_DEBUG, host='0.0.0.0', port=5000)