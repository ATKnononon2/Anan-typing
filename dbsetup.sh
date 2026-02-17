# Githubコードスペース用簡易起動実行ファイル
docker-compose up --build # Dockerコンテナをビルドして起動

# 以下は、Dockerコンテナの管理に役立つコマンドの例です。必要に応じて使用してください。

# コンテナを停止し、コンテナ自体を削除する（データボリュームは残る）
# docker-compose down

# コンテナ停止＋全データ削除＋イメージ削除（完全に初期化したい時）
# docker-compose down --volumes --rmi all --remove-orphans

# 全ての実行中コンテナを強制停止（kill）
# docker kill $(docker ps -q)