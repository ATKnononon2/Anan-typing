document.addEventListener('DOMContentLoaded', () => {
    // - 結果表示要素を取得
    const targetTextElement = document.getElementById('target-text');       // 漢字表示要素
    const hiraganaDisplayElement = document.getElementById('romaji-display'); // ひらがな表示要素
    const romajiTargetElement = document.getElementById('typing-input');     // 色付きローマ字ターゲット要素
    const startButton = document.getElementById('start-button');            // スタートボタン要素
    const timerElement = document.getElementById('timer');                  // タイマー表示要素
    const resultElement = document.getElementById('result');                // 結果表示要素
    const rankListElement = document.getElementById('rank-list');           // ランキング表示要素
    
    // ▼▼▼ 自分のランク表示用の要素を取得 ▼▼▼
    const myRankContainer = document.getElementById('my-rank-container');
    const myRankDisplay = document.getElementById('my-rank-display');
    const myStrokesDisplay = document.getElementById('my-strokes-display');
    const myTpsDisplay = document.getElementById('my-tps-display');
    const myAccuracyDisplay = document.getElementById('my-accuracy-display');
    // ▲▲▲ ▲▲▲

    // メッセージ表示要素の生成と配置
    const messageElement = document.createElement('p');                    
    messageElement.id = 'game-message';                                                
    document.getElementById('game-area').insertBefore(messageElement, romajiTargetElement.nextSibling); 
    
    const errorOverlay = document.getElementById('error-overlay');           // エラーオーバーレイ要素
    const missDisplay = document.getElementById('miss-display');             // ミスタイプ数表示要素

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

    // - 用語の定義
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
        { main: '数少ない時間の中で、如何に成果を出せるかだ。', sub: 'かずすくないじかんのなかで、いかにせいかをだせるかだ。', inp: 'kazusukunaizikannnonakade,ikaniseikawodaserukada.' },
        { main: 'やるかやらないかだろ、今すぐやれ。', sub: 'やるかやらないかだろ、いますぐやれ。', inp: 'yarukayaranaikadaro,imasuguyare.' },
        { main: '授業中に、スマホを触らない。', sub: 'じゅぎょうちゅうにすまほをさわらない。', inp: 'zyugyouchuuha,sumahowosawaranai' },
        { main: '俺は子供が嫌いだ。俺のレベル以下だからだ。', sub: 'おれはこどもがきらいだ。おれのれべるいかだからだ。', inp: 'orehakodomogakiraida.' },
        { main: '大学までバリバリ体育会系だ。', sub: 'だいがくまでばりばりたいいくかいけいだ。', inp: 'daigakumadebaribaritaiikukaikeida.' },
        { main: '意見を言うのは簡単です。', sub: 'いけんをいうのはかんたんです。', inp: 'ikenwoiunohakantandesu.' },
        { main: '行動に移すか、0か1かだ。', sub: 'こうどうにうつすか、0か1かだ。', inp: 'koudouniutusuka,0ka1kada.' },
        { main: '死ぬまでは過労じゃない。', sub: 'しぬまではかろうじゃない。', inp: 'sinumadehakarouzyanai.' },
        { main: '忙しい人は沢山います。', sub: 'いそがしいひとはたくさんいます。', inp: 'isogasiihitohatakusanimasu.' },
        { main: '阿南はお金稼ぎがしたいんですよ。', sub: 'あなんはおかねかせぎがしたいんですよ。', inp: 'ananhaokanekasegigasitaindesuyo.' },
        { main: 'とっくに、下校時間は過ぎてるぞ。', sub: 'とっくに、げこうじかんはすぎてるぞ。', inp: 'tokkuni,kaeruzikanhasugiteruzo.' },
        { main: '俺よりも年齢がちょっと下の人。', sub: 'おれよりもねんれいがちょっとしたのひと。', inp: 'oreyorimonenreigachottoshitanohito.' },
        { main: 'お金が無ければ何も出来ない。', sub: 'おかねがなければなにもできない。', inp: 'okaneganakerebananimodekinai.' },
        { main: '俺は動けるデブだ。', sub: 'おれはうごけるデブだ。', inp: 'orehaugokerudebuda.' },
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
        { main: 'お前は情報テクノロジー大学校へ行け。', sub: 'おまえじょうほうてくのろじーだいがっこうへいけ。', inp: 'omaehazyouhoutekunoroziidaigakkouheike.' }
        // { main: '', sub: '', inp: '' },
    ];
    
    // - ゲーム初期化処理
    function initializeGame() {
        totalKeyStrokes = 0;
        correctKeyStrokes = 0;
        missKeyCount = 0;
        gameStartTime = 0;
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
        hiraganaDisplayElement.textContent = '指示をお待ちください。。。';
        romajiTargetElement.value = ''; 
        romajiTargetElement.innerHTML = ''; 
        missDisplay.textContent = 'ミス: 0'; 

        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);

        // ランキングの表示（記録はしませんが、見るだけ）
        updateRankingDisplayFromAPI(); 
    }

    // - 用語の範囲を指定してランダムに出力
    function RandomPick() {
        // 存在するお題の数
        const N = words.filter(word => word.main !== '').length; 
        const random = Math.floor(Math.random() * N);
        const value = words[random]; 
        targetTextElement.textContent = value.main;
        hiraganaDisplayElement.textContent = value.sub; 
        
        inputString = value.inp; 
        currentIndex = 0; 
        typedRomanBuffer = ''; 
        romajiTargetElement.value = ''; 
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
        romajiTargetElement.disabled = true; 
        messageElement.textContent = '準備してください...';
        messageElement.style.color = '#0056b3';
        targetTextElement.textContent = '';
        hiraganaDisplayElement.textContent = ''; 
        romajiTargetElement.value = ''; 
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

    // - ゲーム開始処理
    function startGame() {
        isGameRunning = true;
        startButton.textContent = '終了';
        startButton.classList.add('end-game-button');
        startButton.disabled = false;
        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', endGameEarly);
        
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
        romajiTargetElement.disabled = false; // 入力を有効化
        romajiTargetElement.focus(); // 入力欄にフォーカス
    }


    // 【重要】色の更新を担当する関数
    function updateDisplay() {
        if (!romajiTargetElement) return;
        let newHtml = '';
        // 現在のターゲットとなるローマ字は inputString に格納されている
        for (let i = 0; i < inputString.length; i++) {
            const char = inputString[i];
            let color = 'black'; 
            if (i < currentIndex) {
                color = 'green'; // 正解済み
            } else if (i === currentIndex) {
                color = 'blue';  // 次に打つ文字
            }
            newHtml += `<span style="color: ${color};">${char}</span>`;
        }
        romajiTargetElement.innerHTML = newHtml;
    }

    // キー入力イベントリスナー（万能入力対応版）
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


    // - ゲームを早期終了する処理
    function endGameEarly() {
        if (isGameRunning && confirm('測定を中止しますか？')) {
            clearInterval(gameTimerId); // タイマーを停止
            isGameRunning = false;
            romajiTargetElement.disabled = true;

            // スコア計算
            gameEndTime = new Date().getTime();
            const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
            const scoreCorrectKeyStrokes = correctKeyStrokes;
            const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
            const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;
            const totalCorrectInput = scoreCorrectKeyStrokes;

            // 結果表示
            resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
            messageElement.textContent = '測定を中止しました。';
            messageElement.style.color = '#d9534f';

            // UIをリセット
            startButton.disabled = false;
            startButton.textContent = 'もう一度プレイ';
            startButton.classList.remove('end-game-button');
            startButton.removeEventListener('click', startCountdown);
            startButton.removeEventListener('click', endGameEarly);
            startButton.addEventListener('click', startCountdown);
            
            // ゲーム状態を初期化
            gameStartTime = 0; 
            timeLeft = initialTime;
            timerElement.textContent = `残り時間: ${timeLeft}秒`;
        }
    }


    // ゲームオーバー処理
    function gameOver() {
        clearInterval(gameTimerId);
        isGameRunning = false;
        
        startButton.disabled = false;
        startButton.textContent = 'もう一度プレイ';
        startButton.classList.remove('end-game-button');

        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);

        gameEndTime = new Date().getTime();
        const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
        
        // スコア計算
        const scoreCorrectKeyStrokes = correctKeyStrokes;
        const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
        const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;
        const totalCorrectInput = scoreCorrectKeyStrokes;

        resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
        
        // ユーザーへのメッセージ（保存しないのでメッセージ変更）
        messageElement.textContent = 'お疲れ様です。';
        messageElement.style.color = '#28a745';

        // ★ランキング記録処理（postRanking）の呼び出しを削除しました
        
        gameStartTime = 0; 
    }

    // - APIからランキングを取得し表示する関数 (閲覧専用)
    function updateRankingDisplayFromAPI() {
        // 要素がない場合はエラーになるのを防ぐ
        if (!rankListElement) return;

        // 読み込み中メッセージ
        rankListElement.innerHTML = '<li>ランキングを読み込み中...</li>';

        fetch('/api/rankings')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const rankings = data.ranking_list;
            const myRankData = data.my_rank;

            // 1. 「あなたの現在のランク」の表示処理
            if (myRankData && myRankContainer) {
                myRankContainer.style.display = 'block';
                myRankDisplay.textContent = myRankData.rank;
                myStrokesDisplay.textContent = myRankData.correct_strokes;
                myTpsDisplay.textContent = myRankData.tps; 
                myAccuracyDisplay.textContent = myRankData.accuracy + '%';
            } else {
                if (myRankContainer) {
                    myRankContainer.style.display = 'none';
                }
            }

            // 2. ランキングリストの表示処理
            rankListElement.innerHTML = '';

            if (!rankings || rankings.length === 0) {
                rankListElement.innerHTML = '<li>まだランキングはありません。</li>';
                return;
            }

            rankings.forEach((rank, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span style="font-weight:bold;">${index + 1}. ${rank.email}</span><br>
                    <span style="font-size:0.9em; margin-left: 15px;">
                        正打数: ${rank.correct_strokes}回 / 
                        TPS: ${rank.tps} / 
                        正誤率: ${rank.accuracy}%
                    </span>`; 
                
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