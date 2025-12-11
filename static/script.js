document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const targetTextElement = document.getElementById('target-text');
    const hiraganaDisplayElement = document.getElementById('romaji-display');
    const romajiTargetElement = document.getElementById('typing-input');
    const startButton = document.getElementById('start-button');
    const timerElement = document.getElementById('timer');
    const resultElement = document.getElementById('result');
    const rankListElement = document.getElementById('rank-list');
    
    // メッセージ要素
    const messageElement = document.createElement('p');
    messageElement.id = 'game-message';
    document.getElementById('game-area').insertBefore(messageElement, romajiTargetElement.nextSibling); 
    
    const errorOverlay = document.getElementById('error-overlay');
    const missDisplay = document.getElementById('miss-display');

    // 変数定義
    let inputString = '';
    let totalKeyStrokes = 0;
    let correctKeyStrokes = 0;
    let missKeyCount = 0;
    let gameStartTime = 0;
    let gameEndTime = 0;
    let gameTimerId;
    let countdownTimerId;
    let timeLeft;
    let isGameRunning = false;
    let initialTime = 60;
    let currentIndex = 0;

    // お題リスト
    const words = [
        { main: '俺のレベルに着いてこい！', sub: 'おれのれべるについてこい！', inp: 'orenoreberunituitekoi!' },
        { main: '返事は、はいかYESか喜んで。', sub: 'へんじは、はいかYESかよろこんで。', inp: 'henziha,haikaYESkayorokonde.' },
        { main: '阿南は優しいんですよ。', sub: 'あなんはやさしいんですよ。', inp: 'ananhayasasiindesuyo.' },
        { main: '自分の限界に挑戦するのが課題研究だ。', sub: 'じぶんのげんかいにちょうせんするのがかだいけんきゅうだ。', inp: 'zibunnnogenkainichousensurunogakadaikenkyuuda.' },
        { main: '俺の心は海よりちょっと狭いくらい。', sub: 'おれのこころはうみよりちょっとせまいくらい。', inp: 'orenokokorohaumiyorichottosemaikurai.' },
        { main: '俺はダイエット中なんだよ。', sub: 'おれはだいえっとちゅうなんだよ。', inp: 'orehadaiettochuunandayo.' },
        { main: 'ほら、早く帰れ。', sub: 'ほら、はやくかえれ。', inp: 'hora,hayakukaere.' },
        { main: '阿南は怒っています。', sub: 'あなんはおこっています。', inp: 'ananhaokotteimasu.' },
        { main: '俺はIT未来を、こんな学校にしたい。', sub: 'おれはITみらいを、こんながっこうにしたい。', inp: 'orehaITmiraiwo,konnnagakkounisitai.' },
        { main: '阿南先生は絶対なんですよ。', sub: 'あなんせんせいはぜったいなんですよ。', inp: 'anansenseihazettainandesuyo.' },
        { main: '君たちの無限の可能性に期待している。', sub: 'きみたちのむげんのかのうせいにきたいしている。', inp: 'kimitatinomugennnokanouseinikitaisiteiru.' },
        { main: '数少ない時間の中で、如何に成果を出せるかだ。', sub: 'すくないじかんのなかで、いかにせいかをだせるかだ。', inp: 'sukunaizikannnonakade,ikaniseikawodaserukada.' },
        { main: 'やるかやらないかだろ、今すぐやれ。', sub: 'やるかやらないかだろ、いますぐやれ。', inp: 'yarukayaranaikadaro,umasuguyare.' },
        { main: '授業中に、スマホを触らない。', sub: 'じゅぎょうちゅうにすまほをさわらない。', inp: 'zyugyouchuuha,sumahowosawaranai' },
        { main: '俺は子供が嫌いだ。俺のレベル以下だからだ。', sub: 'おれはこどもがきらいだ。おれのれべるいかだからだ。', inp: 'orehakodomogakiraida.' },
        { main: '大学までバリバリ体育会系だ。', sub: 'だいがくまでばりばりたいいくかいけいだ。', inp: 'daigakumadebaribaritaiikukaikeida.' },
        { main: '意見を言うのは簡単です。', sub: 'いけんをいうのはかんたんです。', inp: 'ikenwoiunohakantandesu.' },
        { main: '行動に移すか、0か1かだ。', sub: 'こうどうにうつすか、0か1かだ。', inp: 'koudouniutusuka,0ka1kada.' },
        { main: '死ぬまでは過労じゃない。', sub: 'しぬまではかろうじゃない。', inp: 'sinumadehakarouzyanai.' },
        { main: '忙しい人は沢山います。', sub: 'いそがしいひとはたくさんいます。', inp: 'isogasiihitohatakusanimasu.' },
        { main: 'お前は情報テクノロジー大学校へ行け。', sub: 'おまえじょうほうてくのろじーだいがっこうへいけ。', inp: 'omaehazyouhoutekunoroziidaigakkouheike.' }
    ];

    // 初期化
    function initializeGame() {
        totalKeyStrokes = 0; correctKeyStrokes = 0; missKeyCount = 0; gameStartTime = 0;
        inputString = ''; currentIndex = 0;

        missDisplay.textContent = 'ミス: 0';
        timerElement.textContent = `残り時間: ${initialTime}秒`;
        timerElement.classList.remove('countdown');
        startButton.textContent = 'スタート';
        startButton.classList.remove('end-game-button');
        startButton.disabled = false;
        targetTextElement.textContent = '阿南先生は絶対なんですよ。';
        hiraganaDisplayElement.textContent = '指示をお待ちください。。。';
        romajiTargetElement.innerHTML = ''; 

        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);

        updateRankingDisplayFromAPI(); // ランキング表示
    }

    // お題ランダム選択
    function RandomPick() {
        const N = words.filter(word => word.main !== '').length; 
        const random = Math.floor(Math.random() * N);
        const value = words[random]; 
        targetTextElement.textContent = value.main;
        hiraganaDisplayElement.textContent = value.sub; 
        inputString = value.inp; 
        currentIndex = 0; 
        updateDisplay(); 
    }

    // ミスエフェクト
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

    // カウントダウン
    function startCountdown() {
        // 変数リセット
        totalKeyStrokes = 0; correctKeyStrokes = 0; missKeyCount = 0; gameStartTime = 0;
        inputString = ''; currentIndex = 0; timeLeft = initialTime;

        startButton.disabled = true;
        messageElement.textContent = '準備してください...';
        messageElement.style.color = '#0056b3';
        targetTextElement.textContent = '';
        hiraganaDisplayElement.textContent = ''; 
        romajiTargetElement.innerHTML = ''; 
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

    // ゲーム開始
    function startGame() {
        isGameRunning = true;
        startButton.textContent = '終了';
        startButton.classList.add('end-game-button');
        startButton.disabled = false;
        startButton.removeEventListener('click', startCountdown);
        startButton.addEventListener('click', endGameEarly);
        
        timerElement.textContent = `残り時間: ${timeLeft}秒`;
        gameStartTime = new Date().getTime();
        RandomPick();
        
        if (gameTimerId) clearInterval(gameTimerId);
        gameTimerId = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) timeLeft = 0;
            timerElement.textContent = `残り時間: ${timeLeft}秒`;
            if (timeLeft <= 0) {
                gameOver(); 
            }
        }, 1000);
    }

    // 表示更新
    function updateDisplay() {
        if (!romajiTargetElement) return;
        let newHtml = '';
        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];
            let color = 'black'; 
            if (i < currentIndex) color = 'green';
            else if (i === currentIndex) color = 'blue';
            newHtml += `<span style="color: ${color};">${char}</span>`;
        }
        romajiTargetElement.innerHTML = newHtml;
    }

    // キー入力処理
     document.addEventListener('keydown', (event) => {
        if (!isGameRunning) return; // ゲーム中でない場合は何もしない

        // 特殊キーやCtrl/Alt/Metaキーとの組み合わせは無視
        if (event.key.length > 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
            return; 
        }

        // 入力キーを取得
        const pressedKey = event.key;

        // ▼▼▼▼▼▼▼▼▼▼▼▼ 万能変換ロジック開始 ▼▼▼▼▼▼▼▼▼▼▼▼

        // 1. 【先頭文字が変わるパターン】 (ti -> chi, tu -> tsu, hu -> fu など)
        if (currentIndex < inputString.length) {
            const remainingText = inputString.substring(currentIndex);
            
            // 変換リスト (主要なヘボン式・訓令式の違いを網羅)
            const conversions = [
                { main: 'ti',  alt: 'chi' },
                { main: 'tu',  alt: 'tsu' },
                { main: 'hu',  alt: 'fu' },
                { main: 'zi',  alt: 'ji' },
                { main: 'ka',  alt: 'ca' }, { main: 'ku',  alt: 'cu' }, { main: 'ko',  alt: 'co' },
                { main: 'se',  alt: 'ce' },
                // 拗音
                { main: 'tya', alt: 'cha' }, { main: 'tyu', alt: 'chu' }, { main: 'tyo', alt: 'cho' },
                { main: 'zya', alt: 'ja' },  { main: 'zyu', alt: 'ju' },  { main: 'zyo', alt: 'jo' },
                { main: 'jya', alt: 'ja' },  { main: 'jyu', alt: 'ju' },  { main: 'jyo', alt: 'jo' }
            ];

            for (const conv of conversions) {
                // お題が main で始まり、ユーザーが alt の1文字目を打った場合 → alt に置換
                if (remainingText.startsWith(conv.main) && pressedKey === conv.alt[0]) {
                    inputString = inputString.substring(0, currentIndex) + conv.alt + inputString.substring(currentIndex + conv.main.length);
                    updateDisplay();
                    break;
                }
                // お題が alt で始まり、ユーザーが main の1文字目を打った場合 → main に置換
                if (remainingText.startsWith(conv.alt) && pressedKey === conv.main[0]) {
                    inputString = inputString.substring(0, currentIndex) + conv.main + inputString.substring(currentIndex + conv.alt.length);
                    updateDisplay();
                    break;
                }
            }
        }

        // 2. 【2文字目以降で分岐するパターン】 (si -> shi, sha -> sya など)
        if (currentIndex > 0 && currentIndex < inputString.length) {
            const remainingText = inputString.substring(currentIndex);
            const prevChar = inputString[currentIndex - 1]; // すでに打った1文字前の文字

            // 's' を打った直後の分岐処理
            if (prevChar === 's') {
                if (remainingText.startsWith('i') && pressedKey === 'h') {
                    // si -> shi
                    inputString = inputString.substring(0, currentIndex) + 'hi' + inputString.substring(currentIndex + 1);
                    updateDisplay();
                } else if (remainingText.startsWith('hi') && pressedKey === 'i') {
                    // shi -> si
                    inputString = inputString.substring(0, currentIndex) + 'i' + inputString.substring(currentIndex + 2);
                    updateDisplay();
                } else if (remainingText.startsWith('ya') && pressedKey === 'h') {
                    // sya -> sha
                    inputString = inputString.substring(0, currentIndex) + 'ha' + inputString.substring(currentIndex + 2);
                    updateDisplay();
                } else if (remainingText.startsWith('ha') && pressedKey === 'y') {
                    // sha -> sya
                    inputString = inputString.substring(0, currentIndex) + 'ya' + inputString.substring(currentIndex + 2);
                    updateDisplay();
                }
            }
            // 't' を打った直後の分岐処理 (tiが解決済みなので、ここでは tya <-> tcha などの特殊ケース用だが、基本は先頭変換でカバー可能)
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲ 万能変換ロジック終了 ▲▲▲▲▲▲▲▲▲▲▲▲

        
        // 文字キーが押された場合のみ処理
        if (pressedKey.length === 1 || pressedKey === ' ') {
            event.preventDefault(); // デフォルト動作キャンセル

            totalKeyStrokes++; // キータイプ数をカウント

            const targetChar = inputString[currentIndex];

            if (pressedKey === targetChar) {
                // 正解
                correctKeyStrokes++; 
                currentIndex++; 
                
                // 入力欄に値を保持（内部的な互換性のため）
                romajiTargetElement.value += pressedKey; 
                
                // 色の更新
                updateDisplay();
                
                // お題をクリアしたかチェック
                if (currentIndex >= inputString.length) {
                    messageElement.style.color = '#28a745';
                    
                    // 次のお題を表示する前に少し待つ
                    setTimeout(() => {
                        messageElement.textContent = '';
                        RandomPick(); // 次のお題を表示
                        romajiTargetElement.value = ''; 
                    }, 50); 
                }
            } else { 
                // 不正解
                missKeyCount++; 
                missDisplay.textContent = `ミス: ${missKeyCount}`; 
                showMissEffect();
            }




        }
    });

    // ゲームオーバー（スコア送信）
    function gameOver() {
        clearInterval(gameTimerId);
        isGameRunning = false;
        startButton.disabled = false;
        startButton.textContent = 'もう一度プレイ';
        startButton.classList.remove('end-game-button');
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);

        gameEndTime = new Date().getTime();
        const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
        const scoreCorrectKeyStrokes = correctKeyStrokes;
        const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
        const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;
        const totalCorrectInput = scoreCorrectKeyStrokes;

        resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
        messageElement.textContent = 'お疲れ様です。データを保存中...';

        // ★修正点: 名前入力(prompt)を廃止し、セッション認証で送信
        postRanking({ 
            accuracy: accuracy, 
            tps: tps, 
            correct_strokes: totalCorrectInput 
        });
        
        gameStartTime = 0; 
    }

    // ランキング送信
    function postRanking(score) {
        fetch('/api/rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // nameはサーバー側で自動取得するため不要
                accuracy: parseFloat(score.accuracy),
                tps: parseFloat(score.tps),
                correct_strokes: score.correct_strokes 
            })
        })
        .then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
        })
        .then(data => {
            console.log('Saved:', data);
            messageElement.textContent = 'ランキングに保存されました！';
            
            // ★APIから返ってきた最新データを表示に使用（ここが重要）
            // data.rankings に最新のリストが入っている仕様にしています
            if (data.rankings) {
                renderRankingList(data.rankings);
            } else {
                updateRankingDisplayFromAPI();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageElement.textContent = '保存に失敗しました(ログイン切れの可能性があります)';
        });
    }

    // ランキング取得
    function updateRankingDisplayFromAPI() {
        fetch('/api/rankings')
        .then(res => res.json())
        .then(rankings => {
            renderRankingList(rankings);
        })
        .catch(err => {
            rankListElement.innerHTML = '<li>読み込みエラー</li>';
        });
    }

    // ランキング描画 (メールアドレス・正打数・TPS・正誤率)
    function renderRankingList(rankings) {
        rankListElement.innerHTML = '';
        if (!rankings || rankings.length === 0) {
            rankListElement.innerHTML = '<li>データなし</li>';
            return;
        }
        rankings.forEach((rank, index) => {
            const li = document.createElement('li');
            // ★指定通りのフォーマット: メールアドレス、正打数、TPS、正誤率
            li.innerHTML = `
                <span style="font-weight:bold;">${index + 1}. ${rank.email}</span><br>
                <span style="font-size:0.9em; margin-left: 15px;">
                    正打数: ${rank.correct_strokes}回 / 
                    TPS: ${rank.tps} / 
                    正誤率: ${rank.accuracy}%
                </span>`;
            rankListElement.appendChild(li);
        });
    }

    initializeGame();
});