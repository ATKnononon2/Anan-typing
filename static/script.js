// - 結果表示要素を取得
document.addEventListener('DOMContentLoaded', () => {
    const targetTextElement = document.getElementById('target-text'); // 漢字表示要素
    const romajiDisplayElement = document.getElementById('romaji-display'); // ひらがな表示要素
    const typingInputElement = document.getElementById('typing-input'); // ユーザーの入力ローマ字要素
    const startButton = document.getElementById('start-button'); // スタートボタン要素
    const timerElement = document.getElementById('timer'); // タイマー表示要素
    const resultElement = document.getElementById('result'); // 結果表示要素
    const rankListElement = document.getElementById('rank-list'); // ランキング表示要素
    const messageElement = document.createElement('p'); // メッセージ表示要素
    messageElement.id = 'game-message'; // メッセージ要素のIDを設定
    document.getElementById('game-area').insertBefore(messageElement, typingInputElement.nextSibling); // メッセージ要素を入力欄の下に挿入
    const errorOverlay = document.getElementById('error-overlay'); // エラーオーバーレイ要素
    const missDisplay = document.getElementById('miss-display'); // ミスタイプ数表示要素

    let inputString = ''; // お題のローマ字文字列（RandomPickで設定される）
    let totalKeyStrokes = 0; // ゲーム全体での総キータイプ数
    let correctKeyStrokes = 0; // ゲーム全体での正しく打ったキー数
    let missKeyCount = 0; // ゲーム全体でのミスタイプ数
    let gameStartTime = 0; // ゲーム開始時間のタイムスタンプ
    let gameEndTime = 0; // ゲーム終了時間のタイムスタンプ
    let gameTimerId; // ゲームタイマーのID
    let countdownTimerId; // カウントダウンタイマーのID
    let timeLeft; // 残り時間（秒）
    let isGameRunning = false; // ゲームが進行中かどうかのフラグ
    let initialTime = 60; // 初期時間を60秒に設定
    let currentIndex = 0; // 現在の入力位置
    let typedRomanBuffer = ''; // 未使用ですが、互換性のために残す

// - 以下用語を定義
const words = [
    { main: '俺のレベルに着いてこい！', sub: 'おれのれべるについてこい！', inp: 'orenoreberunituitekoi!' },
    { main: '返事は、はいかYESか喜んで。', sub: 'へんじは、はいかYESかよろこんで。', inp: 'henziha,haikaYESkayorokonde.' },
    { main: '阿南は優しいんですよ。', sub: 'あなんはやさしいんですよ。', inp: 'ananhayasasiindesuyo.' },
    { main: '自分の限界に挑戦するのが課題研究だ。', sub: 'じぶんのげんかいにちょうせんするのがかだいけんきゅうだ。', inp: 'zibunnnogenkainichousensurunogakadaikenkyuuda.' },
    { main: '俺の心は海よりちょっと狭いくらい。', sub: '', inp: '' }, //　かずとし情報
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' },
    { main: '', sub: '', inp: '' }
    //{ main: '', sub: '', inp: '' }
];

// - ゲーム初期化処理
function initializeGame() {
    totalKeyStrokes = 0;
    correctKeyStrokes = 0;
    missKeyCount = 0;
    gameStartTime = 0; // ★追加
    typedRomanBuffer = '';
    inputString = ''; 
    currentIndex = 0; 

    missDisplay.textContent = 'ミス: 0'; 
    timerElement.textContent = `残り時間: ${initialTime}秒`;
    timerElement.classList.remove('countdown');
    startButton.textContent = 'スタート';
    startButton.classList.remove('end-game-button');
    startButton.disabled = false;
    targetTextElement.textContent = '阿南先生は絶対なんですよ。';
    romajiDisplayElement.textContent = '指示をお待ちください。。。';
    typingInputElement.value = ''; 
    missDisplay.textContent = 'ミス: 0'; 

    startButton.removeEventListener('click', startCountdown);
    startButton.removeEventListener('click', endGameEarly);
    startButton.addEventListener('click', startCountdown);

    // ★修正: APIからランキングを取得
    updateRankingDisplayFromAPI(); 
}

// - 用語の範囲を指定してランダムに出力
function RandomPick() {
    // 存在するお題の数（空の要素を除く）
    const N = words.filter(word => word.main !== '').length; 
    const random = Math.floor(Math.random() * N);
    const value = words[random]; 
    targetTextElement.textContent = value.main;
    romajiDisplayElement.textContent = value.sub;
    
    inputString = value.inp; 
    currentIndex = 0; 
    typedRomanBuffer = ''; 
    typingInputElement.value = ''; 
    updateDisplay(); 
}

// 入力ミス時のエフェクト表示
function showMissEffect() {
    errorOverlay.classList.remove('active');
    void errorOverlay.offsetWidth;
    errorOverlay.classList.add('active');

    missDisplay.classList.remove('active');
    void missDisplay.offsetWidth;
    missDisplay.classList.add('active');

    setTimeout(() => {
        errorOverlay.classList.remove('active');
        missDisplay.classList.remove('active');
    }, 500);
}

// - カウントダウン開始処理
function startCountdown() {
    // ゲームに必要な変数を初期化
    totalKeyStrokes = 0;
    correctKeyStrokes = 0;
    missKeyCount = 0;
    gameStartTime = 0;
    typedRomanBuffer = '';
    inputString = ''; 
    currentIndex = 0; 
    timeLeft = initialTime; // タイマーをリセット

    startButton.disabled = true;
    typingInputElement.disabled = true;
    messageElement.textContent = '準備してください...';
    messageElement.style.color = '#0056b3';
    targetTextElement.textContent = '';
    romajiDisplayElement.textContent = '';
    typingInputElement.value = '';
    resultElement.textContent = '';
    timerElement.classList.add('countdown');

    let count = 3;
    timerElement.textContent = count;

    countdownTimerId = setInterval(() => {
        count--;
        if (count > 0) {
            timerElement.textContent = count;
        } else if (count === 0) {
            timerElement.textContent = 'スタート！';
        } else {
            clearInterval(countdownTimerId);
            timerElement.classList.remove('countdown');
            messageElement.textContent = '';
            startGame();
        }
    }, 1000);
}

// - ゲーム開始処理
function startGame() {
    isGameRunning = true;
    startButton.textContent = '終了';
    startButton.classList.add('end-game-button');
    startButton.disabled = false;
    startButton.removeEventListener('click', startCountdown);
    startButton.removeEventListener('click', endGameEarly);
    startButton.addEventListener('click', endGameEarly);
    
    // timeLeftはカウントダウン開始時に initialTime で設定済み
    timerElement.textContent = `残り時間: ${timeLeft}秒`;
    
    if (gameStartTime === 0) {
        gameStartTime = new Date().getTime();
    }
    
    RandomPick();
    
    if (gameTimerId) {
        clearInterval(gameTimerId);
    }
    
    gameTimerId = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 0;
        timerElement.textContent = `残り時間: ${timeLeft}秒`;
        if (timeLeft <= 0) {
            gameOver(); // 時間切れの場合はランキングに不送信
        }
    }, 1000);
    typingInputElement.disabled = false; // 入力を有効化
}


// 【重要】色の更新を担当する関数
function updateDisplay() {
    if (!romajiDisplayElement) return; 
    let newHtml = '';
    // 現在のターゲットとなるローマ字は inputString に格納されている
    for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
        let color = 'black'; 
        if (i < currentIndex) {
            color = 'green'; // 正解済み
        } else if (i === currentIndex) {
            color = 'blue';  // 次に打つ文字
        }
        // style属性を含む <span> タグを生成
        newHtml += `<span style="color: ${color};">${char}</span>`;
    }
    // innerHTML で要素全体を上書き
    romajiDisplayElement.innerHTML = newHtml; 
}

document.addEventListener('keydown', (event) => {
    if (!isGameRunning) return; // ゲーム中でない場合は何もしない

    // 特殊キーやCtrl/Alt/Metaキーとの組み合わせは無視
    if (event.key.length > 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        return; 
    }

    // 入力キーを取得 (スペースキーも含む)
    const pressedKey = event.key;
    
    // 文字キーが押された場合のみ処理
    if (pressedKey.length === 1 || pressedKey === ' ') {
        event.preventDefault(); // ブラウザのデフォルト動作（スクロールなど）をキャンセル
        
        totalKeyStrokes++; // キータイプ数をカウント

        const targetChar = inputString[currentIndex];

        if (pressedKey === targetChar) {
            // 正解
            correctKeyStrokes++; // 正解キーをカウント
            currentIndex++; 
            
            // 入力欄に打った文字を反映
            typingInputElement.value += pressedKey; 
            
            // 色の更新
            updateDisplay();
            typingInputElement.style.color = 'green';
            
            // お題をクリアしたかチェック
            if (currentIndex >= inputString.length) {
                messageElement.style.color = '#28a745';
                
                // 次のお題を表示する前に少し待つ
                setTimeout(() => {
                    messageElement.textContent = '';
                    RandomPick(); // 次のお題を表示
                    typingInputElement.value = ''; // 入力欄をクリア
                }, 50); // 少し待つことでメッセージを一瞬表示
            }
        } else { 
            // 不正解
            missKeyCount++; // ミスタイプ数をカウント
            missDisplay.textContent = `ミス: ${missKeyCount}`; // ミスタイプ表示を更新
            showMissEffect();
            typingInputElement.style.color = 'red';
        }
    }
});


// - ゲームを早期終了する処理 (ランキング送信をスキップ)
function endGameEarly() {
    if (isGameRunning && confirm('測定を中止しますか？')) {
        clearInterval(gameTimerId); // タイマーを停止
        isGameRunning = false;
        typingInputElement.disabled = true;

        // スコア計算 (結果表示のため)
        gameEndTime = new Date().getTime();
        const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
        const scoreCorrectKeyStrokes = correctKeyStrokes;
        const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
        const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;
        const totalCorrectInput = scoreCorrectKeyStrokes; // 正しい入力数をスコアとする

        // 結果表示
        resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
        messageElement.textContent = '測定を中止しました。';
        messageElement.style.color = '#d9534f';

        // ランキング送信をスキップ (promptも表示しない)
        
        // UIをリセットし、再スタート可能にする
        startButton.disabled = false;
        startButton.textContent = 'もう一度プレイ';
        startButton.classList.remove('end-game-button');
        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);
        
        // ゲーム状態を初期化（次回のゲーム開始のために重要）
        gameStartTime = 0; 
        timeLeft = initialTime;
        timerElement.textContent = `残り時間: ${timeLeft}秒`;
    }
}


// - ゲームオーバー処理（時間切れの場合のみランキングに送信）
function gameOver() {
    clearInterval(gameTimerId);
    isGameRunning = false;
    typingInputElement.disabled = true;
    startButton.disabled = false;
    startButton.textContent = 'もう一度プレイ';
    startButton.classList.remove('end-game-button');

    startButton.removeEventListener('click', startCountdown);
    startButton.removeEventListener('click', endGameEarly);
    startButton.addEventListener('click', startCountdown);

    messageElement.textContent = 'お疲れ様です。';
    messageElement.style.color = '#d9534f';

    gameEndTime = new Date().getTime();
    const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
    
    // スコア計算
    const scoreCorrectKeyStrokes = correctKeyStrokes;
    const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
    const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;
    const totalCorrectInput = scoreCorrectKeyStrokes; // 正しい入力数をスコアとする

    resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
    
    // ランキング送信（時間切れのみ）
    let playerName = prompt(`お疲れ様です。\n最終結果: 正答率: ${accuracy}% TPS: ${tps} 正解タイプ数: ${totalCorrectInput}回\n名前を入力してください:`);
    if (!playerName) {
        playerName = "名無し";
    }

    // ランキングデータをAPIでバックエンドに送信 (totalCorrectInput を correct_strokes として送信)
    postRanking({ 
        name: playerName, 
        accuracy: accuracy, 
        tps: tps, 
        correct_strokes: totalCorrectInput // ★修正: 正当文字数を送信
    });
    
    gameStartTime = 0; // 次回ゲーム開始のためにリセット
}

// - ランキングデータをバックエンドに送信する関数を新規追加
function postRanking(score) {
    fetch('/api/rankings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // PythonのDBモデルに合うようにデータを整形して送信
        body: JSON.stringify({
            name: score.name,
            accuracy: parseFloat(score.accuracy),
            tps: parseFloat(score.tps),
            correct_strokes: score.correct_strokes // ★修正: 正当文字数を送信
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Ranking added successfully:', data);
        // ランキングの再取得と表示
        updateRankingDisplayFromAPI();
    })
    .catch(error => {
        console.error('Error adding ranking:', error);
        messageElement.textContent = 'ランキングの保存に失敗しました。';
        messageElement.style.color = 'red';
    });
}

// - APIからランキングを取得し表示する関数を新規追加
function updateRankingDisplayFromAPI() {
    rankListElement.innerHTML = '<li>ランキングを読み込み中...</li>';
    fetch('/api/rankings')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(rankings => {
        rankListElement.innerHTML = '';
        if (rankings.length === 0) {
            rankListElement.innerHTML = '<li>まだランキングはありません。</li>';
            return;
        }
        rankings.forEach((rank, index) => {
            const li = document.createElement('li');
            // ★修正: 日付と強調表示を削除
            li.innerHTML = `<span>${index + 1}.</span> <span>${rank.name}</span> 
                            <span>正打数: ${rank.correct_strokes}回</span> 
                            <span>TPS: ${rank.tps}</span> 
                            <span>正誤率: ${rank.accuracy}%</span>`; 
            rankListElement.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error fetching rankings:', error);
        rankListElement.innerHTML = '<li>ランキングの取得に失敗しました。</li>';
    });
}

initializeGame();
});