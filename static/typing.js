document.addEventListener('DOMContentLoaded', () => {
    // - 結果表示要素を取得
    const targetTextElement = document.getElementById('target-text');       // 漢字表示要素
    const hiraganaDisplayElement = document.getElementById('romaji-display'); // ひらがな表示要素
    const romajiTargetElement = document.getElementById('typing-input');     // 色付きローマ字ターゲット要素
    const startButton = document.getElementById('start-button');            // スタートボタン要素
    const timerElement = document.getElementById('timer');                  // タイマー表示要素
    const resultElement = document.getElementById('result');                // 結果表示要素
    const rankListElement = document.getElementById('rank-list');           // ランキング表示要素
    
    // ▼▼▼ 追加: 自分のランク表示用の要素を取得 ▼▼▼
    const myRankContainer = document.getElementById('my-rank-container');
    const myRankDisplay = document.getElementById('my-rank-display');
    const myStrokesDisplay = document.getElementById('my-strokes-display');
    const myTpsDisplay = document.getElementById('my-tps-display');
    const myAccuracyDisplay = document.getElementById('my-accuracy-display');
    // ▲▲▲ 追加終わり ▲▲▲

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
        { main: '俺のレベルに追いてこい！', sub: 'おれのれべるについてこい！', inp: 'orenoreberunituitekoi!' },
        { main: '返事は、はいかYESか喜んで。', sub: 'へんじは、はいかYESかよろこんで。', inp: 'henziha,haikaYESkayorokonde.' },
        { main: '阿南は優しいんですよ。', sub: 'あなんはやさしいんですよ。', inp: 'ananhayasasiindesuyo.' },
        { main: '自分の限界に挑戦するのが課題研究だ。', sub: 'じぶんのげんかいにちょうせんするのがかだいけんきゅうだ。', inp: 'zibunnnogenkainichousensurunogakadaikenkyuuda.' },
        { main: '俺の心は海よりちょっと狭いくらい。', sub: 'おれのこころはうみよりちょっとせまいくらい。', inp: 'orenokokorohaumiyorichottosemaikurai.' },
        { main: '俺はダイエット中なんだよ。', sub: 'おれはだいえっとちゅうなんだよ。', inp: 'orehadaiettochuunandayo.' },
        { main: 'ほら早く帰れ。', sub: 'ほらはやくかえれ。', inp: 'horahayakukaere.' },
        { main: '阿南は怒っています。', sub: 'あなんはおこっています。', inp: 'ananhaokotteimasu.' },
        { main: '俺はIT未来高校を、凄いですね。と言われる学校にしたい。', sub: '', inp: '.' },
        { main: '阿南先生は絶対なんですよ。', sub: 'あなんせんせいはぜったいなんですよ。', inp: 'anansenseihazettainandesuyo.' },
        { main: '君たちの無限の可能性に期待している。', sub: 'きみたちのむげんのかのうせいにきたいしている。', inp: 'kimitatinomugennnokanouseinikitaisiteiru.' },
        { main: '数少ない時間の中で、如何に成果を出せるかだ。', sub: 'かずすくないじかんのなかで、いかにせいかをだせるかだ。', inp: 'kazusukunaizikannnonakade,ikaniseikawodaserukada.' },
        { main: 'やるかやらないかだろ、今すぐやれ。', sub: 'やるかやらないかだろ、いますぐやれ。', inp: 'yarukayaranaikadaro,imasuguyare.' },
        { main: '授業中に、スマホを触らない。', sub: 'じゅぎょうちゅうに、すまほをさわらない。', inp: 'zyugyouchuuni,sumahowosawaranai' },
        { main: '俺は子供が嫌いだ。俺のレベル以下だからだ。', sub: 'おれはこどもがきらいだ。おれのれべるいかだからだ。', inp: 'orehakodomogakiraida.orenoreberuikadakarada.' },
        { main: '大学までバリバリ体育会系だ。', sub: 'だいがくまでばりばりたいいくかいけいだ。', inp: 'daigakumadebaribaritaiikukaikeida.' },
        { main: '意見を言うのは簡単です。', sub: 'いけんをいうのはかんたんです。', inp: 'ikenwoiunohakantandesu.' },
        { main: '行動に移すか、0か1かだ。', sub: 'こうどうにうつすか、0か1かだ。', inp: 'koudouniutusuka,0ka1kada.' },
        { main: '死ぬまでは過労じゃない。', sub: 'しぬまではかろうじゃない。', inp: 'sinumadehakarouzyanai.' },
        { main: '忙しい人は沢山います。', sub: 'いそがしいひとはたくさんいます。', inp: 'isogasiihitohatakusanimasu.' },
        { main: '阿南はお金稼ぎがしたいんですよ。', sub: 'あなんはおかねかせぎがしたいんですよ。', inp: 'ananhaokanekasegigasitaindesuyo.' },
        { main: 'とっくに、下校時間は過ぎてるぞ。', sub: 'とっくに、げこうじかんはすぎてるぞ。', inp: 'tokkuni,gekouzikanhasugiteruzo.' },
        { main: '俺よりも年齢がちょっと下の人。', sub: 'おれよりもねんれいがちょっとしたのひと。', inp: 'oreyorimonenreigachottoshitanohito.' },
        { main: 'お金が無ければ何も出来ない。', sub: 'おかねがなければなにもできない。', inp: 'okaneganakerebananimodekinai.' },
        { main: '俺は動けるデブだ。', sub: 'おれはうごけるデブだ。', inp: 'orehaugokerudebuda.' },
        { main: '俺と対等に話せる人が欲しいから俺のレベルまで来てくれよ。', sub: 'おれとたいとうにはなせるひとがほしいからおれのれべるまできてくれよ。', inp: 'oretotaitounihanaseruhitogahosiikaraorenoreberumadekitekureyo.' },
        { main: '残業なんて当たり前ですよ。', sub: 'ざんぎょうなんてあたりまえですよ。', inp: 'zangyounanteatarimaedesuyo.' },
        { main: '阿南先生の昨日の睡眠時間は? 2時間。', sub: 'あなんせんせいのきのうのすいみんじかんは? 2じかん。', inp: 'anansenseinokinounosuiminzikanha?2zikan.' },
        { main: '俺はショートスリーパーなんだよ。', sub: 'おれはしょーとすりーぱーなんだよ。', inp: 'orehasho-tosuri-pa-nandayo.' },
        { main: '眠いなら立ってれば良いんですよ。', sub: 'ねむいならたってればいいんですよ。', inp: 'nemuinaratatterebaiindesuyo.' },
        { main: 'お昼が一番眠くなるんだよ。', sub: 'おひるがいちばんねむくなるんだよ。', inp: 'ohirugaitibannnemukunarundayo.' },
        { main: '制作と作成の違い分かってる？', sub: 'せいさくとさくせいのちがいわかってる？', inp: 'seisakutosakuseinotigaiwakatteru?' },
        { main: 'この授業の為に子供からミニカーを取り上げてきた。', sub: 'このじゅぎょうのためにこどもからミニカーをとりあげてきた。', inp: 'konojyugyounotamenikodomokaraminika-wotoriagetekita.' },
        { main: 'Youtubeで育った息子はどうなるのか実験中だ。', sub: 'Youtubeでそだったむすこはどうなるのかじっけんちゅうだ。', inp: 'Youtubedesodattamusukohadounarunokazikkenchuuda.' },
        { main: '課題研究で放置して、どこまで出来るか実験している。', sub: 'かだいけんきゅうでほうちして、どこまでできるかじっけんしている。', inp: 'kadaikenkyuudedokomadedekirukazikkensiteiru.' },
        { main: '最近コーラが高くなって、飲めなくなっちったんだよ。', sub: 'さいきんこーらがたかくなって、のめなくなっちったんだよ。', inp: 'saikinko-ragatakakunatte,nomenakunattittandayo.' },
        { main: '自販機からコーラが無くなって、先生悲しい。', sub: 'じはんきからこーらがなくなって、せんせいかなしい。', inp: 'zihankikarako-raganakunatte,senseikanasii.' },
        { main: '阿南先生、今度鳥取行ってきます。', sub: 'あなんせんせい、こんどとっとりいってきます。', inp: 'anansenseikondotottoriittekimasu.' },
        { main: '行ってきましたよ、鳥取砂丘。', sub: 'いってきましたよ、とっとりさきゅう。', inp: 'ittekimasitayo,tottorisakkyuu.' },
        { main: '俺はIT未来に20年しがみ付く!', sub: 'おれはITみらいに20ねんしがみつく!', inp: 'orehaITmirani20nensigamituku!' },
        { main: '次の産フェア茨城の時には、阿南は先生じゃなくなっている。', sub: 'つぎのさんふぇあいばらきのときには、あなんはせんせいじゃなくなっている。', inp: 'tuginosanfeaibarakinotokiniha,ananhasenseizyanakunatteiru.' },
        { main: '皆さん知っていますか。', sub: 'みなさんしっていますか。', inp: 'minasansitteimasuka.' },
        { main: '阿南先生の残業時間は過労死ラインを超えています。', sub: 'あなんせんせいのざんぎょうじかんはかろうしらいんをこえています。', inp: 'anansenseinozangyozikanhakarousirainwokoeteimasu.' },
        { main: '阿南先生は、嬉しい。', sub: 'あなんせんせいは、うれしい。', inp: 'anansenseiha,ureshii.' },
        { main: '阿南先生は目標を達成したんですよ。', sub: 'あなんせんせいはもくひょうをたっせいしたんですよ。', inp: 'anansenseihamokuhyouwotasseisitandesuyo.' },
        { main: 'キーボードの位置が変わってて、一年生になんて説明すればいいんですか。', sub: 'きーぼーどのいちがかわってて、いちねんせいになんてせつめいすればいいんですか', inp: 'ki-bo-donoitigakawatte,itinenseininantesetumeisurebaiindesuka' },
        { main: 'だから阿南の言う通りにしておけばとは敢えて言いませんが。', sub: 'だからあなんのいうとおりにしておけばとはあえていいませんが。', inp: 'dakaraanannnoiutourinisiteokebatohaaeteiimasenga.' },
        { main: '阿南先生は肖像権NGなんですよ。', sub: 'あなんせんせいはしょうぞうけんNGなんですよ。', inp: 'anansenseihashouzoukenNGnandesuyo.' },
        { main: '急遽阿南はお休みになりました。', sub: 'きゅうきょあなんはおやすみになりました。', inp: 'kyuukyoananhaoyasumininarimasita.' },
        { main: 'Canvaがアツいんですよ。', sub: 'canvaがあついんですよ。', inp: 'Canvagaatuindesuyo.' },
        { main: '阿南先生の休日のご予定はなんですか? 仕事です。', sub: 'あなんせんせいのきゅうじつのごよていはなんですか? しごとです。', inp: 'anansenseinokyuuzitunogoyoteihanandesuka?sigotodesu.' },
        { main: '阿南の言葉は譲り受けなんですよ。', sub: 'あなんせんせいのことばはゆずりうけなんですよ。', inp: 'anansenseinokotobahayuzuriukenandesuyo.' },
        { main: 'うちの課題研究は出せるレベルのことをやっている。', sub: 'うちのかだいけんきゅうはだせるれべるのことをやっている。', inp: 'utinokadaikenkyuuhadaserureberunokotowoyatteiru.' },
        { main: '500万の金を出す代わり、全情コンの件数を報告しろ。', sub: '500まんのかねをだすかわり、ぜんじょうこんのけんすうをほうこくしろ。', inp: '500mannnokanewodasukawarini,zenzyoukonnnokensuuwohoukokusiro.' },
        { main: '冬休みに完成させてくるんですよね?', sub: 'ふゆやすみにかんせいさせてくるんですよね?', inp: 'fuyuyasuminikanseisasetekurundesuyone?' },
        { main: 'Geminiが使えない奴は、社会で役に立たない。', sub: 'Geminiがつかえないやつは、しゃかいでやくにたたない。', inp: 'Geminigatukaenaiyatuhasyakaideyakunitatanai.' },
        { main: 'Geminiと会話できない奴は社会でも会話できない。', sub: 'Geminiとかいわできないやつはしゃかでもかいわできない。', inp: 'Geminitokaiwadekinaiyatuhasyakaidemoyakunitatanai.' },
        { main: '阿南先生の言葉が知りたいんだったら、小沢一郎の言葉を調べるといいですよ。', sub: 'あなんせんせいのことばがしりたいんだったら、おざわいちろうのことばをしらべるといいですよ。', inp: 'anansenseinokotobawosiritaindattara,ozawaitirounokotobawosiraberutoiidesuyo.' },
        { main: '〇〇さんとお友達になる方法', sub: 'まるまるさんとおともだちになるほうほう', inp: 'marumarusantootomodatininaruhouhou' },
        { main: 'お前ら勉強しろ。', sub: 'おまえらべんきょうしろ。', inp: 'omaerabenkyousiro.' },
        { main: '阿南先生の偉大さを理解しましたか？', sub: 'あなんせんせいのいだいさをりかいしましたか？', inp: 'anansenseinoidaisaworikaishimashitaka?' },
        { main: 'テストの点数は勉強しないと取れないと。', sub: 'てすとのてんすうはべんきょうしないととれないと。', inp: 'tesutonotensuuhabenkyoushinaitotorenaito.' },
        { main: '今日の夜も明日の朝もやった方が効率がいい。', sub: 'きょうのよるもあしたのあさもやったほうがこうりつがいい。', inp: 'kyounoyorumoassitanoasamoyattahougakouritsugaii.' },
        { main: '偉大な阿南先生が息子になんて言ったか想像できますか。', sub: 'いだいなあなんせんせいがむすこになんていったかそうぞうできますか。', inp: 'idainaanansenseigamusukoninanteittakasouzoudekimasuka.' },
        { main: '俺はテスト前に全部覚えてやるから必要ねえ。', sub: 'おれはてすとまえにぜんぶおぼえてやるからひつようねえ。', inp: 'orehatesutomaenizenbuoboeteyarukarahitsuyounee.' },
        { main: 'たかだか一言で俺の偉大さが終わってしまったんですよ。', sub: 'たかだかひとことでおれのいだいさがおわってしまったんですよ。', inp: 'takadakahitokotodeorenoidaisagaowatteshimattandesuyo.' },
        { main: '俺と一緒で偉大なんだろ。', sub: 'おれといっしょでいだいなんだろ。', inp: 'oretoissyodeidainandaro.' },
        { main: 'カードゲームをやってる。いやー偉大だね。', sub: 'かーどげーむをやってる。いやーいだいだね。', inp: 'ka-doge-muwoyatteru.iya-idaidane.' },
        { main: '俺のレベルに追いついたってことですか。', sub: 'おれのれべるにおいついたってことですか。', inp: 'orenoreberunioitsuitattekotodesuka.' },
        { main: '結局、学び続けなければならない。', sub: 'けっきょく、まなびつづけなければならない。', inp: 'kekyoku,manabituzukenakerebanaranai.' },
        { main: '一緒に働きたいと思える人になれるかどうか', sub: 'いっしょにはたらきたいとおもえるひとになれるかどうか。', inp: 'issyonihatarakitaitoomoeruhitoninarerukadouka.' },
        { main: '阿南先生は偉大ですから。', sub: 'あなんせんせいはいだいですから。', inp: 'anansensehaidaidesukara.' },
        { main: '俺は人に良い影響を与えられる人が素晴らしいと思うよ。', sub: 'おれはひとにいいえいきょうをあたえられるひとがすばらしいとおもうよ。', inp: 'orehahitoniiieikyouwoataerareruhitogasubarashiitoomouyo.' },
        { main: '20代後半まで限界まで勉強して限界を知った。', sub: 'にじゅうだいこうはんまでげんかいまでべんきょうしてげんかいをしった。', inp: 'nijuudaikouhanmadegenkaimadebenkyoushitegenkaiwoshitta.' },
        { main: 'できることとできないことを知れた。', sub: 'できることとできないことをしれた。', inp: 'dekirukototodekinaikotowoshireta.' },
        { main: '阿南先生は全部知っていますよ。', sub: 'あなんせんせいはぜんぶしっていますよ。', inp: 'anansensehazenbushitteimasuyo.' },
        { main: '悪い所を知った上でどう活かすか。', sub: 'わるいところをしったうえでどういかすか。', inp: 'waruitokorowoshittauededouikasuka.' },
        { main: '誇りを持って、しっかりと挑んでください。', sub: 'ほこりをもって、しっかりといどんでください。', inp: 'hokoriwomotte,shikkaritoidondekudasai.' },
        { main: '恥をかかないように、しっかりとした準備が必要だと思います。', sub: 'はじをかかないように、しっかりとしたじゅんびがひつようだとおもいます。', inp: 'hajiwokakanaiyouni,shikkaritoshitajunbigahitsuyoudatoomimasu.' },
        { main: 'お疲れ様でした。', sub: 'おつかれさまでした。', inp: 'otsukaresamadeshita.' },
        { main: 'お前は情報テクノロジー大学校へ行け。', sub: 'おまえじょうほうてくのろじーだいがっこうへいけ。', inp: 'omaehazyouhoutekunorozi-daigakkouheike.' }
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

        // ランキングを取得
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
                gameOver(); // 時間切れの場合はランキングに不送信
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
                color = 'rgba(0, 0, 0, 0.3)'; // 正解済み
            } else if (i === currentIndex) {
                color = '#002fff';  // 次に打つ文字
            }
            newHtml += `<span style="color: ${color};">${char}</span>`;
        }
        romajiTargetElement.innerHTML = newHtml;
    }


    
    // キー入力イベントリスナー（万能入力対応版）
    document.addEventListener('keydown', (event) => {
        if (!isGameRunning) return;

        // 特殊キーやCtrl/Alt/Metaキーとの組み合わせは無視
        if (event.key.length > 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
            return; 
        }

        const pressedKey = event.key;

        // ▼▼▼▼▼▼▼▼▼▼▼▼ 万能変換ロジック開始 ▼▼▼▼▼▼▼▼▼▼▼▼
        // -------------------------------------------------------------------------
        // 1. 【先頭文字が変わるパターン】 (ti -> chi, hu -> fu など)
        // -------------------------------------------------------------------------
        if (currentIndex < inputString.length) {
            const remainingText = inputString.substring(currentIndex);
        
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
                // 【重要】1文字目が同じ場合（tu vs tsu, ja vs jya 等）は、
                // ここで判定すると誤動作の原因になるためスキップし、後続の「セクション2」に任せる
                if (conv.main[0] === conv.alt[0]) {
                    continue;
                }

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

        // -------------------------------------------------------------------------
        // 2. 【2文字目以降で分岐するパターン】 (si <-> shi, tu <-> tsu, ja <-> jya など)
        // -------------------------------------------------------------------------
        if (currentIndex > 0 && currentIndex < inputString.length) {
            const remainingText = inputString.substring(currentIndex);
            const prevChar = inputString[currentIndex - 1]; // すでに打った1文字前の文字

            // ここに行を追加するだけで対応パターンを増やせる
            const rules = [
                // --- S行 (si <-> shi, sha <-> sya) ---
                { prev: 's', target: 'i',  input: 'h', replace: 'hi' }, // si -> shi
                { prev: 's', target: 'hi', input: 'i', replace: 'i'  }, // shi -> si
                { prev: 's', target: 'ya', input: 'h', replace: 'ha' }, // sya -> sha
                { prev: 's', target: 'ha', input: 'y', replace: 'ya' }, // sha -> sya
                { prev: 's', target: 'yu', input: 'h', replace: 'hu' }, // syu -> shu
                { prev: 's', target: 'hu', input: 'y', replace: 'yu' }, // shu -> syu
                { prev: 's', target: 'yo', input: 'h', replace: 'ho' }, // syo -> sho
                { prev: 's', target: 'ho', input: 'y', replace: 'yo' }, // sho -> syo

                // --- T行 (tu <-> tsu, ti <-> tyi ※tyiは稀だが一応) ---
                { prev: 't', target: 'u',  input: 's', replace: 'su' }, // tu -> tsu
                { prev: 't', target: 'su', input: 'u', replace: 'u'  }, // tsu -> tu

                // --- J行 (ja <-> jya, ju <-> jyu, jo <-> jyo) ---
                // ja -> jya
                { prev: 'j', target: 'a',  input: 'y', replace: 'ya' }, 
                { prev: 'j', target: 'u',  input: 'y', replace: 'yu' }, 
                { prev: 'j', target: 'o',  input: 'y', replace: 'yo' }, 
                // jya -> ja
                { prev: 'j', target: 'ya', input: 'a', replace: 'a'  }, 
                { prev: 'j', target: 'yu', input: 'u', replace: 'u'  }, 
                { prev: 'j', target: 'yo', input: 'o', replace: 'o'  }, 
            ];

            // ルールを走査して一致するものを適用
            for (const rule of rules) {
                if (prevChar === rule.prev && remainingText.startsWith(rule.target) && pressedKey === rule.input) {
                    // 文字列を置換
                    inputString = inputString.substring(0, currentIndex) + rule.replace + inputString.substring(currentIndex + rule.target.length);
                    updateDisplay();
                    break; // 一致したらループを抜ける
                }
            }
        }
        
        // -------------------------------------------------------------------------
        // 3. 【「ん」を n -> nn で入力できるパターン】
        // -------------------------------------------------------------------------
        if (currentIndex > 0 && currentIndex < inputString.length) {
            const prevChar = inputString[currentIndex - 1]; // すでに打った1文字前の文字
            const nextChar = inputString[currentIndex];     // 現在ターゲットになっている文字

            // 直前に 'n' を打っていて、今回ユーザーが 'n' を打った場合
            if (prevChar === 'n' && pressedKey === 'n') {
                // 次のお題の文字が母音、'y'、またはすでに 'n' ではないかチェック
                const isVowelOrYOrN = ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(nextChar);
                
                // na, ni 等や既に nn になっている状態「以外」なら実行
                if (!isVowelOrYOrN) {
                    // お題文字列の現在の位置に 'n' を挿入して内部的に 'nn' に変換
                    inputString = inputString.substring(0, currentIndex) + 'n' + inputString.substring(currentIndex);
                    updateDisplay();
                    // ※この直後の処理で pressedKey('n') と 新たに挿入された targetChar('n') がマッチして正解扱いになります
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
                    messageElement.style.color = '#8f8f8fff';
                    
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


    // - ゲームを早期終了する処理 (ランキング送信をスキップ)
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
        
        // もし入力エリアが <input> タグなら以下が必要ですが、
        // <div>タグでキーイベントを取得している場合は不要なのでコメントアウトしておきます
        // romajiTargetElement.disabled = true; 

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
        
        // ユーザーへのメッセージ
        messageElement.textContent = 'お疲れ様です。データを保存します。';
        messageElement.style.color = '#d9534f';

        // スコアデータだけを送信
        postRanking({ 
            accuracy: accuracy, 
            tps: tps, 
            correct_strokes: totalCorrectInput 
        });
        
        gameStartTime = 0; 
    }

    // - ランキングデータをバックエンドに送信する関数
    function postRanking(score) {
        fetch('/api/rankings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // name はサーバー側(Python)でセッションから自動取得するので送信不要
                accuracy: parseFloat(score.accuracy),
                tps: parseFloat(score.tps),
                correct_strokes: score.correct_strokes 
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
            
            // ★重要: サーバーから最新のランキングリストが返ってきている場合、
            // それを直接表示関数に渡すと無駄な通信が減らせます。
            // サーバーの実装次第ですが、ここでは念のため再取得のままにします。
            updateRankingDisplayFromAPI();
        })
        .catch(error => {
            console.error('Error adding ranking:', error);
            messageElement.textContent = 'ランキングの保存に失敗しました。';
            messageElement.style.color = 'red';
        });
    }

    // - APIからランキングを取得し表示する関数 (自分のランク表示機能を追加)
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

            // ▼▼▼ 1. 「あなたの現在のランク」の表示処理 ▼▼▼
            if (myRankData && myRankContainer) {
                // データがあれば表示オン
                myRankContainer.style.display = 'block';

                // 各項目に値をセット
                myRankDisplay.textContent = myRankData.rank;
                myStrokesDisplay.textContent = myRankData.correct_strokes;
                myTpsDisplay.textContent = myRankData.tps; // 必要なら .toFixed(2) など
                myAccuracyDisplay.textContent = myRankData.accuracy + '%';
            } else {
                // データがなければ（ランク外または未プレイ）非表示
                if (myRankContainer) {
                    myRankContainer.style.display = 'none';
                }
            }

            // ▼▼▼ 2. ランキングリスト（TOP 300）の表示処理 ▼▼▼
            rankListElement.innerHTML = '';

            if (!rankings || rankings.length === 0) {
                rankListElement.innerHTML = '<li>まだランキングはありません。</li>';
                return;
            }

            rankings.forEach((rank, index) => {
                const li = document.createElement('li');
                
                // rank.name が無い場合を考慮して rank.email を使用
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