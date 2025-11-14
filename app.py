from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
import datetime
import logging

# ロギング設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# データベース設定
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

db = SQLAlchemy(app)

# ランキングモデルの定義
class Ranking(db.Model):
    """
    ランキングデータを保存するためのデータベースモデル。
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)        # 正誤率
    tps = db.Column(db.Float, nullable=False)             # TPS (Type Per Second)
    correct_strokes = db.Column(db.Integer, nullable=False) # ★追加: 正当文字数
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow) # ★修正: 記録日時をDateTime型で保持

    def __repr__(self):
        return f"<Ranking {self.name} - CorrectStrokes: {self.correct_strokes}>"

    def to_dict(self):
        """
        オブジェクトを辞書形式に変換し、JSONレスポンスで利用できるようにします。
        """
        return {
            'id': self.id,
            'name': self.name,
            'accuracy': self.accuracy,
            'tps': self.tps,
            'correct_strokes': self.correct_strokes, # ★追加
            # データベースのタイムスタンプをクライアント表示用に整形
            'date': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') 
        }

def create_tables_once():
    # ... (既存のコード) ...
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        with app.app_context():
            # 既存のテーブルをドロップして新しいスキーマを適用したい場合は以下の2行を有効化
            # db.drop_all()
            db.create_all()
            logging.info("データベーステーブルが作成されたか、すでに存在しています。")

create_tables_once()

@app.route('/')
def index():
    """
    ゲームのメインページを表示します。
    """
    return render_template('index.html')

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    """
    保存されているランキングデータを取得し、JSON形式で返します。
    正当文字数で降順、次にTPSで降順、最後に精度で降順にソートし、上位10件を返します。
    """
    try:
        # ★修正: 正当文字数 -> TPS -> 精度 の順でソート
        all_rankings = Ranking.query.order_by(
            Ranking.correct_strokes.desc(), # 1. 正当文字数 (最優先)
            Ranking.tps.desc(),             # 2. TPS
            Ranking.accuracy.desc(),        # 3. 精度
            Ranking.timestamp.asc()         # 4. 同スコアの場合は登録が古い順
        ).limit(10).all()

        # オブジェクトのリストを辞書のリストに変換
        rankings_data = [ranking.to_dict() for ranking in all_rankings]
        logging.info("ランキングデータが正常に取得されました。")
        return jsonify(rankings_data), 200
    except Exception as e:
        logging.error(f"ランキングの取得中にエラーが発生しました: {e}")
        return jsonify({"error": "Failed to retrieve rankings"}), 500

@app.route('/api/rankings', methods=['POST'])
def add_ranking():
    """
    新しいランキングデータを追加し、データベースに保存します。
    """
    new_score_data = request.json
    if not new_score_data:
        logging.warning("ランキング追加リクエスト: データが提供されていません。")
        return jsonify({"error": "No data provided"}), 400

    # スコアの必須項目と型チェック
    # ★修正: 'date' を削除し、'correct_strokes' を追加
    required_fields = {
        'name': str,
        'accuracy': (float, int), 
        'tps': (float, int),
        'correct_strokes': (float, int), # クライアント側でIntegerとして送信されることを期待
        # 'date' はクライアント側から受け取る必要はなくなりました
    }

    for field, expected_type in required_fields.items():
        if field not in new_score_data:
            logging.warning(f"ランキング追加リクエスト: 必須フィールド '{field}' が不足しています。")
            return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # 型チェック
        if not isinstance(new_score_data[field], expected_type):
            logging.warning(f"ランキング追加リクエスト: フィールド '{field}' の型が不正です。期待される型: {expected_type}, 受け取った型: {type(new_score_data[field])}")
            return jsonify({"error": f"Invalid type for field '{field}'. Expected {expected_type}, got {type(new_score_data[field])}"}), 400

    # 値の基本的な検証
    name = new_score_data['name'].strip()
    if not (1 <= len(name) <= 50): # 名前の長さを制限
        logging.warning(f"ランキング追加リクエスト: 名前の長さが不正です: '{name}'")
        return jsonify({"error": "Name must be between 1 and 50 characters"}), 400
    
    try:
        accuracy = float(new_score_data['accuracy'])
        tps = float(new_score_data['tps'])
        correct_strokes = int(new_score_data['correct_strokes']) # ★追加
        
        # 値の範囲チェック
        if accuracy < 0 or tps < 0 or correct_strokes < 0:
            logging.warning(f"ランキング追加リクエスト: スコアが負の値です。accuracy={accuracy}, tps={tps}, correct_strokes={correct_strokes}")
            return jsonify({"error": "Score values cannot be negative"}), 400

    except (ValueError, TypeError) as e:
        logging.warning(f"ランキング追加リクエスト: 数値変換エラーまたは不正な値: {e}")
        return jsonify({"error": f"Invalid data format for score values: {e}"}), 400


    try:
        # 新しいランキングエントリを作成
        new_ranking = Ranking(
            name=name,
            accuracy=accuracy,
            tps=tps,
            correct_strokes=correct_strokes, # ★追加
            # timestampはdefaultで自動設定されます
        )
        db.session.add(new_ranking)
        db.session.commit()
        logging.info(f"新しいランキングが追加されました: {new_ranking.name}")

        # 追加後、再度ランキングを取得して上位10件を返す
        all_rankings = Ranking.query.order_by(
            Ranking.correct_strokes.desc(),
            Ranking.tps.desc(),
            Ranking.accuracy.desc()
        ).limit(10).all()
        updated_rankings_data = [ranking.to_dict() for ranking in all_rankings]

        return jsonify({"message": "Ranking added successfully", "rankings": updated_rankings_data}), 201

    except Exception as e:
        db.session.rollback() # エラーが発生した場合はロールバック
        logging.error(f"ランキングの追加中にデータベースエラーが発生しました: {e}")
        return jsonify({"error": "Failed to add ranking due to database error"}), 500

if __name__ == '__main__':
    # Flaskアプリを開発モードで実行
    # 既存のDBファイルを削除して新しいスキーマで再構築したい場合は、
    # アプリ実行前に 'site.db' ファイルを削除してください。
    app.run(debug=True)