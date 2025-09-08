document.addEventListener('DOMContentLoaded', () => {
    const targetTextElement = document.getElementById('target-text');
    const romajiDisplayElement = document.getElementById('romaji-display');
    const typingInputElement = document.getElementById('typing-input');
    const startButton = document.getElementById('start-button');
    const timerElement = document.getElementById('timer');
    const resultElement = document.getElementById('result');
    const rankListElement = document.getElementById('rank-list');
    const messageElement = document.createElement('p');
    messageElement.id = 'game-message';
    document.getElementById('game-area').insertBefore(messageElement, typingInputElement.nextSibling);

    const errorOverlay = document.getElementById('error-overlay');
    const missDisplay = document.getElementById('miss-display');

    let currentText = '';
    let currentRoman = ''; // 現在のお題に対する「代表的な」ローマ字列
    let typedRomanBuffer = ''; // ユーザーが現在入力しているローマ字のバッファ

    let hiraganaIndex = 0; // 現在入力すべきひらがなのインデックス

    let totalKeyStrokes = 0; // ゲーム全体での総キータイプ数
    let correctKeyStrokes = 0; // ゲーム全体での正しく打ったキー数
    let missKeyCount = 0; // ゲーム全体でのミスタイプ数

    let gameTimerId;
    let countdownTimerId;
    let timeLeft;
    let gameStartTime = 0; // ゲーム全体の開始時刻（ゲームが開始された瞬間）
    let gameEndTime = 0; // ゲーム全体の終了時刻
    let totalGameDuration = 0; // ゲーム全体のプレイ時間（秒）

    let gameLevel = 0; // ゲームの継続ターン数 (お題クリア数)

    let isGameRunning = false;
    let kanaToRomanMap = {}; // ひらがなからローマ字への変換マップ

    const dailyPhrases = [
        "こんにちは", "ありがとう", "おはようございます", "おやすみなさい",
        "いただきます", "ごちそうさまでした", "いってきます", "ただいま",
        "おかえりなさい", "おつかれさまです", "よろしくおねがいします", "ごめんなさい",
        "しつれいします", "ちょっとまってください", "これはなんですか", "げんきですか",
        "またあした", "きょうもいちにちがんばろう", "おてんきがいいですね", "すきなたべものはなんですか",
        "おなかすいた", "ねむいですね", "がんばってください", "だいじょうぶですか",
        "おもしろいですね", "かんたんにつくれるよ", "いまなんじですか", "どこへいくの",
        "なにをしているの", "たのしいじかんでした", "わすれないでください", "これからどうする",
        "きをつけてかえってね", "またこんどね", "かんしゃしています"
    ];

    // ローマ字からひらがなへの変換ルール (バリエーション対応強化版)
    const romajiToHiraganaRules = {
        // 拗音 (長いものから記述して優先度を高める)
        'kyou': 'きょう', 'shoo': 'しょお',

        'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
        'sha': 'しゃ', 'sya': 'しゃ', 'shu': 'しゅ', 'syu': 'しゅ', 'sho': 'しょ', 'syo': 'しょ',
        'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
        'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
        'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
        'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
        'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
        'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
        'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
        'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
        'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
        'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',

        // 促音
        'xtsu': 'っ', 'ltsu': 'っ',

        // 通常のひらがな (複数のローマ字入力があるもの - 優先度順で記述)
        'shi': 'し', 'si': 'し',
        'chi': 'ち', 'ti': 'ち',
        'tsu': 'つ', 'tu': 'つ',
        'ji': 'じ', 'zi': 'じ',
        'di': 'ぢ',
        'zu': 'ず', 'du': 'づ',

        // 撥音 'ん'
        'nn': 'ん', 'n': 'ん', // n単独も認識。ただし、次に母音やyが続く場合、または句読点の前などでは 'n' + ' で区切る表示。

        // 基本のひらがな
        'a': 'あ', 'i': 'i', 'u': 'う', 'e': 'え', 'o': 'お',
        'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
        'sa': 'さ', 'su': 'す', 'se': 'せ', 'so': 'そ',
        'ta': 'た', 'te': 'て', 'to': 'と',
        'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
        'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
        'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
        'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
        'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
        'wa': 'わ', 'wo': 'を',

        // 濁音
        'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
        'za': 'ざ', 'ze': 'ぜ', 'zo': 'ぞ',
        'da': 'だ', 'de': 'で', 'do': 'ど',
        'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',

        // 半濁音
        'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',

        // 小文字の母音
        'xa': 'ぁ', 'xi': 'ぃ', 'xu': 'ぅ', 'xe': 'ぇ', 'xo': 'ぉ',
        'xya': 'ゃ', 'xyu': 'ゅ', 'xyo': 'ょ',
        'xwa': 'ゎ',
    };

    // な行のひらがなを判別するためのセット
    const nagyoHiragana = new Set(['な', 'に', 'ぬ', 'ね', 'の']);

    // ひらがなからローマ字への変換マップを生成（入力判定用）
    function buildKanaToRomanMap() {
        const map = {};
        for (const romaji in romajiToHiraganaRules) {
            const hiragana = romajiToHiraganaRules[romaji];
            if (!map[hiragana]) {
                map[hiragana] = [];
            }
            map[hiragana].push(romaji);
        }
        for (const hiragana in map) {
            map[hiragana].sort((a, b) => b.length - a.length);
        }
        return map;
    }

    // ひらがな文字列を対応する「代表的な」ローマ字文字列に変換する関数
    function convertHiraganaToRoman(hiragana) {
        let roman = '';
        let i = 0;
        while (i < hiragana.length) {
            let matched = false;
            for (let len = 3; len >= 1; len--) {
                const subHiragana = hiragana.substring(i, i + len);
                if (kanaToRomanMap[subHiragana]) {
                    const candidateRoman = kanaToRomanMap[subHiragana][0];

                    if (subHiragana === 'っ' && i + len < hiragana.length) {
                        const nextHiraganaChar = hiragana[i + len];
                        let nextRomanFirstChar = '';
                        const nextHiraganaRomanCandidates = kanaToRomanMap[nextHiraganaChar];
                        if (nextHiraganaRomanCandidates && nextHiraganaRomanCandidates.length > 0) {
                            nextRomanFirstChar = nextHiraganaRomanCandidates[0].charAt(0);
                        }
                        if (nextRomanFirstChar && !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(nextRomanFirstChar)) {
                            roman += nextRomanFirstChar;
                        } else {
                            roman += 'xtsu';
                        }
                    } else if (subHiragana === 'ん') {
                         if (i + len < hiragana.length) {
                            const nextChar = hiragana[i + len]; // 次のひらがな文字
                            // 次の文字がな行でない、かつ母音やyではない場合、n単独をデフォルトとする
                            if (!nagyoHiragana.has(nextChar) && !['あ', 'い', 'う', 'え', 'お', 'や', 'ゆ', 'よ'].includes(nextChar)) {
                                roman += 'n';
                            } else {
                                // な行が続く、または母音・yが続く場合は n' または nn を採用
                                let isVowelOrY = false;
                                if (nextChar && kanaToRomanMap[nextChar]) {
                                    const nextCharRomanCandidates = kanaToRomanMap[nextChar];
                                    if (nextCharRomanCandidates && nextCharRomanCandidates.length > 0) {
                                        const firstRomanChar = nextCharRomanCandidates[0].charAt(0);
                                        if (['a', 'i', 'u', 'e', 'o', 'y'].includes(firstRomanChar)) {
                                            isVowelOrY = true;
                                        }
                                    }
                                }
                                if (isVowelOrY) {
                                    roman += 'n\''; // 例: かんい -> kan'i
                                } else {
                                    roman += 'nn'; // 例: みんな -> minna
                                }
                            }
                        } else {
                            roman += 'n'; // 文末の 'ん'
                        }
                    } else {
                        roman += candidateRoman;
                    }
                    i += len;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                roman += hiragana[i];
                i++;
            }
        }
        return roman;
    }

    let rankings = [];
    try {
        const storedRankings = localStorage.getItem('typingRankings');
        if (storedRankings) {
            rankings = JSON.parse(storedRankings);
        }
    } catch (e) {
        console.error("Failed to parse rankings from localStorage:", e);
        rankings = [];
    }

    const initialTime = 60;

    function initializeGame() {
        gameLevel = 0;
        totalKeyStrokes = 0;
        correctKeyStrokes = 0;
        missKeyCount = 0;
        gameStartTime = 0;
        gameEndTime = 0;
        totalGameDuration = 0;
        hiraganaIndex = 0;
        typedRomanBuffer = '';

        typingInputElement.value = '';
        typingInputElement.disabled = true;
        resultElement.textContent = '';
        timerElement.textContent = `残り時間: ${initialTime}秒`;
        timerElement.classList.remove('countdown');
        startButton.textContent = 'スタート';
        startButton.classList.remove('end-game-button');
        startButton.disabled = false;
        messageElement.textContent = '';

        // IMEを無効化し、アルファベット入力を優先
        typingInputElement.setAttribute('autocomplete', 'off');
        typingInputElement.setAttribute('autocorrect', 'off');
        typingInputElement.setAttribute('autocapitalize', 'off');
        typingInputElement.setAttribute('spellcheck', 'false');
        typingInputElement.setAttribute('inputmode', 'english'); // アルファベット入力モードに設定

        // CSSでime-modeをinactiveに設定するクラスを追加
        typingInputElement.classList.add('ime-inactive');

        startButton.removeEventListener('click', startCountdown);
        startButton.removeEventListener('click', endGameEarly);
        startButton.addEventListener('click', startCountdown);

        kanaToRomanMap = buildKanaToRomanMap();
        generateRandomText();
        updateRankingDisplay();
    }

    function generateRandomText() {
        const randomIndex = Math.floor(Math.random() * dailyPhrases.length);
        currentText = dailyPhrases[randomIndex];
        currentRoman = getRomanForCurrentHiragana();

        hiraganaIndex = 0;
        typedRomanBuffer = '';
        renderTargetText();
        renderRomajiDisplay();
    }

    function renderTargetText() {
        targetTextElement.innerHTML = '';
        currentText.split('').forEach((char, index) => {
            let span = document.createElement('span');
            span.textContent = char;

            if (index < hiraganaIndex) {
                span.classList.add('correct');
            } else if (index === hiraganaIndex) {
                span.classList.add('current');
            }
            targetTextElement.appendChild(span);
        });
    }

    function renderRomajiDisplay() {
        const currentHiraganaTargetRoman = getRomanForCurrentHiragana();

        if (currentHiraganaTargetRoman.startsWith(typedRomanBuffer)) {
            romajiDisplayElement.textContent = currentHiraganaTargetRoman.substring(typedRomanBuffer.length);
        } else {
            romajiDisplayElement.textContent = currentRoman; // ミスした場合はお題のローマ字全体を表示
        }
    }


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

    function startCountdown() {
        startButton.disabled = true;
        typingInputElement.disabled = true;
        messageElement.textContent = 'ゲームスタートまで';
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

    function startGame() {
        isGameRunning = true;
        typingInputElement.value = '';
        typingInputElement.disabled = false;
        typingInputElement.focus(); // 自動でフォーカス

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

        generateRandomText();
        renderRomajiDisplay();

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

    typingInputElement.addEventListener('keydown', (e) => {
        if (!isGameRunning) {
            e.preventDefault();
            return;
        }

        const pressedKey = e.key;

        // IME入力中の場合は `isComposing` が `true` になります。
        // 日本語入力モードでの変換確定前の入力を防ぎます。
        if (e.isComposing || !e.key) {
            return; // 変換中の場合や、キーが特定できない場合は処理しない
        }

        if (pressedKey === 'Backspace') {
            if (typedRomanBuffer.length > 0) {
                typedRomanBuffer = typedRomanBuffer.slice(0, -1);
            }
            renderTargetText();
            renderRomajiDisplay();
            e.preventDefault();
            return;
        }

        // 半角英数字以外のキー入力を無視 (IMEの日本語入力を防ぐ強力な対策)
        // Shift, Control, Alt, Meta, Tab, Enter などは許可
        const isPrintableAscii = pressedKey.length === 1 && pressedKey.match(/^[a-zA-Z0-9!"#$%&'()*+,-./:;<=>?@\[\\\]^_`{|}~ ]$/);
        if (!isPrintableAscii) {
            // 例外的に許可するキー (Enter, Ctrl, Shift, Altなど)
            if (!['Enter', 'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(pressedKey)) {
                e.preventDefault(); // それ以外の文字は入力を防ぐ
            }
            return;
        }
        
        totalKeyStrokes++;

        typedRomanBuffer += pressedKey;

        let hiraganaConverted = false;
        let foundMatch = false;

        const currentHiraganaChar = currentText[hiraganaIndex];
        
        // 促音の特殊処理
        if (currentHiraganaChar === 'っ' && typedRomanBuffer.length === 1) {
            const nextHiraganaChar = currentText[hiraganaIndex + 1];
            if (nextHiraganaChar) {
                const nextHiraganaRomanCandidates = kanaToRomanMap[nextHiraganaChar];
                if (nextHiraganaRomanCandidates && nextHiraganaRomanCandidates.length > 0) {
                    const firstRomanCharOfNext = nextHiraganaRomanCandidates[0].charAt(0);
                    if (firstRomanCharOfNext && !['a', 'i', 'u', 'e', 'o', 'n', 'y'].includes(firstRomanCharOfNext)) {
                        if (pressedKey === firstRomanCharOfNext) {
                            correctKeyStrokes++;
                            hiraganaIndex++;
                            typedRomanBuffer = '';
                            hiraganaConverted = true;
                            foundMatch = true;
                        } else {
                            missKeyCount++;
                            showMissEffect();
                            typedRomanBuffer = '';
                            foundMatch = true;
                        }
                    }
                }
            }
        }
        
        // 通常のひらがな変換ロジック
        if (!foundMatch) {
            let maxCheckLen = Math.min(3, currentText.length - hiraganaIndex);
            for (let checkLen = maxCheckLen; checkLen >= 1; checkLen--) {
                const subHiragana = currentText.substring(hiraganaIndex, hiraganaIndex + checkLen);
                const possibleRomaji = kanaToRomanMap[subHiragana];

                if (possibleRomaji) {
                    for (const romajiCand of possibleRomaji) {
                        if (romajiCand.startsWith(typedRomanBuffer)) {
                            foundMatch = true;
                            if (typedRomanBuffer === romajiCand) {
                                correctKeyStrokes++;
                                hiraganaIndex += checkLen;
                                typedRomanBuffer = '';
                                hiraganaConverted = true;
                                break;
                            }
                        }
                    }
                }
                if (hiraganaConverted) break;
            }
        }
        
        if (hiraganaConverted) {
            if (hiraganaIndex === currentText.length) {
                handleTextCompletion();
            } else {
                renderTargetText();
                renderRomajiDisplay();
            }
        } else if (!foundMatch && typedRomanBuffer.length > 0) {
            missKeyCount++;
            showMissEffect();

            const targetCharSpan = targetTextElement.querySelector('.char.current');
            if (targetCharSpan) {
                targetCharSpan.classList.add('incorrect');
                setTimeout(() => {
                    targetCharSpan.classList.remove('incorrect');
                }, 200);
            }
            typedRomanBuffer = ''; // 入力ミスしたバッファをクリアして再入力を促す
        }
        typingInputElement.value = ''; // 入力欄の表示をクリア
        e.preventDefault(); // 入力イベントのデフォルト動作をキャンセル
    });


    function handleTextCompletion() {
        gameLevel++;
        messageElement.textContent = `クリア！ ${gameLevel}連続クリア！`;
        messageElement.style.color = 'green';

        typingInputElement.value = '';
        typingInputElement.focus();

        generateRandomText();
        renderRomajiDisplay();

        timerElement.textContent = `残り時間: ${timeLeft}秒`;
    }

    function endGameEarly() {
        if (isGameRunning && confirm('ゲームを終了しますか？')) {
            timeLeft = 0;
            timerElement.textContent = `残り時間: ${timeLeft}秒`;
            gameOver();
        }
    }

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

        messageElement.textContent = 'ゲームオーバーです。';
        messageElement.style.color = 'red';

        gameEndTime = new Date().getTime();
        totalGameDuration = (gameEndTime - gameStartTime) / 1000;

        const accuracy = totalKeyStrokes > 0 ? ((correctKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0;
        const tps = totalGameDuration > 0 ? (correctKeyStrokes / totalGameDuration).toFixed(2) : 0;

        resultElement.textContent = `最終結果: 正誤率 ${accuracy}%, TPS ${tps}, 継続ターン数 ${gameLevel}`;

        let playerName = prompt(`ゲームオーバー！\n最終結果:\n正誤率: ${accuracy}%\nTPS: ${tps}\n継続ターン数: ${gameLevel}\n名前を入力してください:`);
        if (!playerName) {
            playerName = "名無し";
        }
        addRanking({ name: playerName, accuracy: accuracy, tps: tps, turns: gameLevel, date: new Date().toLocaleString() });

        initializeGame();
    }

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