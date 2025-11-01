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

    let currentText = ''; // 現在のお題のひらがな文字列
    let currentRoman = ''; // 現在のお題に対する「代表的な」ローマ字列
    let typedRomanBuffer = ''; // ユーザーが現在入力しているローマ字のバッファ
    let totalKeyStrokes = 0; // ゲーム全体での総キータイプ数
    let correctKeyStrokes = 0; // ゲーム全体での正しく打ったキー数
    let missKeyCount = 0; // ゲーム全体でのミスタイプ数
    let gameStartTime = 0; // ゲーム開始時間のタイムスタンプ
    let gameEndTime = 0; // 
    let gameTimerId; // ゲームタイマーのID
    let countdownTimerId; // カウントダウンタイマーのID
    let timeLeft; // 残り時間（秒）
    let gameLevel = 0; // ゲームの継続ターン数 (お題クリア数)
    let isGameRunning = false; // ゲームが進行中かどうかのフラグ
    let initialTime = 60; // 初期時間を60秒に設定
    let currentIndex = 0; // 現在の入力位置

// - 以下用語を定義
const words = [
  { main: '俺のレベルに着いてこい！', sub: 'おれのれべるについてこい！', inp: 'orenoreberunituitekoi!' },
  { main: '返事は、はいかYESか喜んで。', sub: 'へんじは、はいかyesかよろこんで。', inp: 'henziha,haikayeskayorokonde.' },
  { main: '阿南は優しいんですよ。', sub: 'あなんはやさしいんですよ。', inp: 'ananhayasasiindesuyo.' },
  { main: '自分の限界に挑戦するのが課題研究だ。', sub: '', inp: '' },
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
  { main: '', sub: '', inp: '' },
  { main: '', sub: '', inp: '' }
  //{ main: '', sub: '', inp: '' }
];

// - ゲーム初期化処理
function initializeGame() {
    gameLevel = 0;
    totalKeyStrokes = 0;
    correctKeyStrokes = 0;
    missKeyCount = 0;
    totalGameDuration = 0;
    typedRomanBuffer = '';

    resultElement.textContent = '';
    timerElement.textContent = `残り時間: ${initialTime}秒`;
    timerElement.classList.remove('countdown');
    startButton.textContent = 'スタート';
    startButton.classList.remove('end-game-button');
    startButton.disabled = false;
    messageElement.textContent = '';

    startButton.removeEventListener('click', startCountdown);
    startButton.removeEventListener('click', endGameEarly);
    startButton.addEventListener('click', startCountdown);

    kanaToRomanMap = buildKanaToRomanMap();
    RandomPick();
    updateRankingDisplay();
}

// - 用語の範囲を指定してランダムに出力
function RandomPick() {
    const N = 3;
    const random = Math.floor(Math.random() * N);
    value = words[random];
    targetTextElement.textContent = value.main;
    romajiDisplayElement.textContent = value.sub;
    typingInputElement.textContent = value.inp;
    inputString = value.inp;;
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
    startButton.disabled = true;
    typingInputElement.disabled = true;
    messageElement.textContent = '準備してください...';
    messageElement.style.color = '#0056b3';
    targetTextElement.textContent = '';
    romajiDisplayElement.textContent = '';
    typingInputElement.textContent = '';
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
    timeLeft = initialTime;
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
            gameOver();
        }
    }, 1000);
}


// 入力処理
const typedTextElement = document.getElementById('typed-text')
// 【前提】inputString, currentIndex, typingTargetElement が定義済みであること

// 【重要】色の更新を担当する関数
function updateDisplay() {
    if (!typingTargetElement) return;

    let newHtml = '';
    
    for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
        let color = 'black'; 
        
        if (i < currentIndex) {
            color = 'green'; // 正解済み
        } else if (i === currentIndex) {
            color = 'blue';  // 次に打つ文字
        }
        
        // ★重要★ style属性を含む <span> タグを生成
        newHtml += `<span style="color: ${color};">${char}</span>`;
    }

    // ★最重要★ innerHTML で要素全体を上書き
    typingTargetElement.innerHTML = newHtml;
}

document.addEventListener('keydown', (event) => {
    if (currentIndex >= inputString.length) {
        RandomPick();
        currentIndex = 0;
        typedTextElement.textContent = '';
    }

    if (event.key.length > 1 && event.key !== ' ') {
        return; 
    }

    const pressedKey = event.key;
    typedTextElement.textContent += pressedKey;
    const targetChar = inputString[currentIndex];
    if (pressedKey === targetChar) {
        currentIndex++; 
        updateDisplay();
        if (messageElement) {
            typingInputElement.style.color = 'green';
        }
    } else if (pressedKey.length === 1) { 
        if (messageElement) {
            showMissEffect();
        }
    }
});



// - ゲームを早期終了する処理
function endGameEarly() {
    if (isGameRunning && confirm('測定を中止しますか？')) {
        timeLeft = 0;
        timerElement.textContent = `残り時間: ${timeLeft}秒`;
        gameOver();
    }
}

// - ゲームオーバー処理
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
    totalGameDuration = (gameEndTime - gameStartTime) / 1000;

    const accuracy = totalKeyStrokes > 0 ? ((correctKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
    const tps = totalGameDuration > 0 ? (correctKeyStrokes / totalGameDuration).toFixed(2) : 0;

    resultElement.textContent = `最終結果: 正誤率 ${accuracy}%, TPS ${tps}, 継続ターン数 ${gameLevel}`;

    let playerName = prompt(`お疲れ様です。\n最終結果:正誤率: ${accuracy}% TPS: ${tps} 継続ターン数: ${gameLevel}\n名前を入力してください:`);
    if (!playerName) {
        playerName = "名無し";
    }
    addRanking({ name: playerName, accuracy: accuracy, tps: tps, turns: gameLevel, date: new Date().toLocaleString() });
    initializeGame();
}

// - ランキングデータの取得と保存
function addRanking(score) {
    if (!Array.isArray(rankings)) {
        rankings = [];
    }
    rankings.push(score);
    rankings.sort((a, b) => {
        const tpsA = parseFloat(a.tps);
        const tpsB = parseFloat(b.tps);
        if (tpsB !== tpsA) {
            return tpsB - tpsA;
        }
        if (b.turns !== a.turns) {
            return b.turns - a.turns;
        }
        const accuracyA = parseFloat(a.accuracy);
        const accuracyB = parseFloat(b.accuracy);
        return accuracyB - accuracyA;
    });
    if (rankings.length > 10) {
        rankings = rankings.slice(0, 10);
    }
    try {
        localStorage.setItem('typingRankings', JSON.stringify(rankings));
    } catch (e) {
        console.error("Failed to save rankings to localStorage:", e);
        alert("ランキングの保存に失敗しました。ブラウザのストレージ設定を確認してください。");
    }
    updateRankingDisplay();
}

function updateRankingDisplay() {
    rankListElement.innerHTML = '';
    if (rankings.length === 0) {
        rankListElement.innerHTML = '<li>まだランキングはありません。</li>';
        return;
    }
    rankings.forEach((rank, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}.</span> <span>${rank.name}</span> <span>正誤率: ${rank.accuracy}%</span> <span>TPS: ${rank.tps}</span> <span>ターン数: ${rank.turns}</span> <span>(${rank.date})</span>`;
        rankListElement.appendChild(li);
    });
}



initializeGame();
});