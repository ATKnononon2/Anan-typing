document.addEventListener('DOMContentLoaded', () => {

    // - 結果表示要素を取得
    const targetTextElement = document.getElementById('target-text');         // 漢字表示要素
    const hiraganaDisplayElement = document.getElementById('romaji-display'); // ひらがな表示要素
    const romajiTargetElement = document.getElementById('typing-input');      // 色付きローマ字ターゲット要素
    const startButton = document.getElementById('start-button');              // スタートボタン要素
    const timerElement = document.getElementById('timer');                    // タイマー表示要素
    const resultElement = document.getElementById('result');                  // 結果表示要素
    const rankListElement = document.getElementById('rank-list');             // ランキング表示要素
    
    // - 自分のランク表示用の要素を取得
    const myRankContainer = document.getElementById('my-rank-container');     // 自分のランク表示コンテナ要素
    const myRankDisplay = document.getElementById('my-rank-display');         // 自分のランク表示要素
    const myStrokesDisplay = document.getElementById('my-strokes-display');   // 自分の総キータイプ数表示要素
    const myTpsDisplay = document.getElementById('my-tps-display');           // 自分の入力速度表示要素
    const myAccuracyDisplay = document.getElementById('my-accuracy-display'); // 自分の正答率表示要素

    // - メッセージ表示要素の生成と配置
    const messageElement = document.createElement('p');                       // メッセージ表示用の要素を生成
    const errorOverlay = document.getElementById('error-overlay');            // エラーオーバーレイ要素
    const missDisplay = document.getElementById('miss-display');              // ミスタイプ数表示要素

    messageElement.id = 'game-message';                                                                 // メッセージ表示用のIDを設定
    document.getElementById('game-area').insertBefore(messageElement, romajiTargetElement.nextSibling); // タイピング入力欄の下に配置

    // - ゲームに必要な変数の初期化
    let inputString = '';      // お題のローマ字文字列（RandomPickで設定される）
    let totalKeyStrokes = 0;   // ゲーム全体での総キータイプ数
    let correctKeyStrokes = 0; // ゲーム全体での正しく打ったキー数
    let missKeyCount = 0;      // ゲーム全体でのミスタイプ数
    let gameStartTime = 0;     // ゲーム開始時間のタイムスタンプ
    let gameEndTime = 0;       // ゲーム終了時間のタイムスタンプ
    let gameTimerId;           // ゲームタイマーのID
    let countdownTimerId;      // カウントダウンタイマーのID
    let timeLeft;              // 残り時間（秒）
    let isGameRunning = false; // ゲームが進行中かどうかのフラグ
    let initialTime = 60;      // 初期時間を60秒に設定
    let currentIndex = 0;      // 現在の入力位置
    let unplayedWords = [];    // まだ出題されていないお題のリスト
    let gameToken = '';        // サーバーから受け取る不正防止用トークン


    // - お題の定義
    const words = [
        { main: '俺のレベルに追いてこい！', sub: 'おれのれべるについてこい！', inp: 'orenoreberunituitekoi!' },
        { main: '返事は、はいかYESか喜んで。', sub: 'へんじは、はいかYESかよろこんで。', inp: 'henziha,haikaYESkayorokonde.' },
        { main: '阿南は優しいんですよ。', sub: 'あなんはやさしいんですよ。', inp: 'ananhayasasiindesuyo.' },
        { main: '自分の限界に挑戦するのが課題研究だ。', sub: 'じぶんのげんかいにちょうせんするのがかだいけんきゅうだ。', inp: 'zibunnnogenkainichousensurunogakadaikenkyuuda.' },
        { main: '俺の心は海よりちょっと狭いくらい。', sub: 'おれのこころはうみよりちょっとせまいくらい。', inp: 'orenokokorohaumiyorichottosemaikurai.' },
        { main: '俺はダイエット中なんだよ。', sub: 'おれはだいえっとちゅうなんだよ。', inp: 'orehadaiettochuunandayo.' },
        { main: 'ほら早く帰れ。', sub: 'ほらはやくかえれ。', inp: 'horahayakukaere.' },
        { main: '阿南は怒っています。', sub: 'あなんはおこっています。', inp: 'ananhaokotteimasu.' },
        { main: '俺はIT未来高校を、凄いですね。と言われる学校にしたい。', sub: 'おれはITみらいこうこうを、すごいですね。といわれるがっこうにしたい。', inp: 'orehaITmiraikoukouwo,suguidesune.toiwarerugakkounishitai.' },
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
        { main: '阿南先生は全部知っていますよ。', sub: 'あなんせんせいはぜんぶしっていますよ。', inp: 'anansenseihazenbushitteimasuyo.' },
        { main: '悪い所を知った上でどう活かすか。', sub: 'わるいところをしったうえでどういかすか。', inp: 'waruitokorowoshittauededouikasuka.' },
        { main: '誇りを持って、しっかりと挑んでください。', sub: 'ほこりをもって、しっかりといどんでください。', inp: 'hokoriwomotte,shikkaritoidondekudasai.' },
        { main: '恥をかかないように、しっかりとした準備が必要だと思います。', sub: 'はじをかかないように、しっかりとしたじゅんびがひつようだとおもいます。', inp: 'hajiwokakanaiyouni,shikkaritoshitajunbigahitsuyoudatoomimasu.' },
        { main: 'お疲れ様でした。', sub: 'おつかれさまでした。', inp: 'otsukaresamadeshita.' },
        { main: 'ユニークな方も来ておりますので...冗談です。', sub: 'ゆにーくなかたもきておりますので...じょうだんです。', inp: 'yunikunakatamokiteorimasunode...joudandesu.' },
        { main: 'お前は情報テクノロジー大学校へ行け。', sub: 'おまえじょうほうてくのろじーだいがっこうへいけ。', inp: 'omaehazyouhoutekunorozi-daigakkouheike.' }
        // { main: '', sub: '', inp: '' },
    ];


    // - ゲーム初期化処理
    function initializeGame() {

        // ゲームに必要な変数を初期化
        totalKeyStrokes = 0;   // ゲーム全体での総キータイプ数
        correctKeyStrokes = 0; // ゲーム全体での正しく打ったキー数
        missKeyCount = 0;      // ゲーム全体でのミスタイプ数
        gameStartTime = 0;     // ゲーム開始時間のタイムスタンプ
        typedRomanBuffer = ''; // 現在のローマ字入力のバッファ
        inputString = '';      // お題のローマ字文字列（RandomPickで設定される）
        currentIndex = 0;      // 現在の入力位置

        // ゲームエリアの表示を初期状態にリセット
        missDisplay.textContent = 'ミス: 0';                             // ミスタイプ数をリセット
        timerElement.textContent = `残り時間: ${initialTime}秒`;          // タイマーを初期状態にリセット
        timerElement.classList.remove('countdown');                      // カウントダウンのクラスを削除
        startButton.textContent = 'スタート';                             // スタートボタンのテキストをリセット
        startButton.classList.remove('end-game-button');                 // スタートボタンのクラスをリセット
        startButton.disabled = false;                                    // スタートボタンを有効化
        targetTextElement.textContent = '阿南先生は絶対なんですよ。';      // 漢字表示を初期状態にリセット
        hiraganaDisplayElement.textContent = '指示をお待ちください。。。'; // ひらがな表示を初期状態にリセット
        romajiTargetElement.value = '';                                  // 色付きローマ字ターゲットをリセット
        romajiTargetElement.innerHTML = '';                              // 色付きローマ字ターゲットのHTMLをリセット
        missDisplay.textContent = 'ミス: 0';                             // ミスタイプ数をリセット

        // イベントリスナーのリセット
        startButton.removeEventListener('click', startCountdown); // スタートボタンのクリックイベントをリセット
        startButton.removeEventListener('click', endGameEarly);   // スタートボタンのクリックイベントをリセット
        startButton.addEventListener('click', startCountdown);    // スタートボタンにカウントダウン開始イベントを追加

        // ランキング表示を初期化
        updateRankingDisplayFromAPI(); // ランキング表示をAPIから更新する関数を呼び出す
    }

    // - お題を範囲から指定してランダムに出力
    function RandomPick() {

        // もし未出題のお題がなくなったら、すべてのお題を再補充する
        if (unplayedWords.length === 0) {
            unplayedWords = words.filter(word => word.main !== '');
        }

        // 未出題リストの中からランダムに選ぶ
        const random = Math.floor(Math.random() * unplayedWords.length);
        const value = unplayedWords[random]; 

        // 選んだお題を未出題リストから削除する（重複防止）
        unplayedWords.splice(random, 1);

        // お題の表示を更新
        targetTextElement.textContent = value.main;     // 漢字表示を更新
        hiraganaDisplayElement.textContent = value.sub; // ひらがな表示を更新

        inputString = value.inp;        // お題のローマ字文字列を更新
        currentIndex = 0;               // 入力位置をリセット
        typedRomanBuffer = '';          // ローマ字入力のバッファをリセット
        romajiTargetElement.value = ''; // 色付きローマ字ターゲットをリセット
        updateDisplay();                // 色付きローマ字ターゲットの表示を更新
    }

    // - 入力ミス時のエフェクト表示
    function showMissEffect() {

        // ミスタイプ数を更新して表示
        errorOverlay.classList.remove('active');     // 一度クラスをリセットしてから再度追加することで、CSSアニメーションを再トリガー
        void errorOverlay.offsetWidth;               // エラーオーバーレイの幅を取得してリセットを強制する
        errorOverlay.classList.add('active');        // ミスタイプ数表示も同様にアニメーションを再トリガー

        // ミスタイプ数表示の更新
        missDisplay.classList.remove('active');      // ミスタイプ数表示のクラスをリセット
        void missDisplay.offsetWidth;                // ミスタイプ数表示の幅を取得してリセットを強制する
        missDisplay.classList.add('active');         // ミスタイプ数表示にアクティブクラスを追加してアニメーションを開始

        // 500ms後にエフェクトを消す
        setTimeout(() => {
            errorOverlay.classList.remove('active'); // エラーオーバーレイのアクティブクラスを削除してフェードアウトさせる
            missDisplay.classList.remove('active');  // ミスタイプ数表示のアクティブクラスを削除してフェードアウトさせる
        }, 500);
    }

    // - カウントダウン開始処理
    async function startCountdown() {

        // ゲームに必要な変数を初期化
        totalKeyStrokes = 0;    // ゲーム全体での総キータイプ数
        correctKeyStrokes = 0;  // ゲーム全体での正しく打ったキー数
        missKeyCount = 0;       // ゲーム全体でのミスタイプ数
        gameStartTime = 0;      // ゲーム開始時間のタイムスタンプ
        typedRomanBuffer = '';  // 現在のローマ字入力のバッファ
        inputString = '';       // お題のローマ字文字列（RandomPickで設定される）
        currentIndex = 0;       // 入力位置をリセット
        timeLeft = initialTime; // タイマーをリセット
        unplayedWords = [];     // プレイ開始時に未出題リストを空にする

        // UIの初期化
        startButton.disabled = true;                       // スタートボタンを一時的に無効化して、カウントダウン中のクリックを防止
        romajiTargetElement.disabled = true;               // ローマ字入力を一時的に無効化して、カウントダウン中の入力を防止
        messageElement.textContent = '準備してください...'; // メッセージをカウントダウン開始の案内に変更
        messageElement.style.color = '#0056b3';          // メッセージの色を青に変更
        targetTextElement.textContent = '';                // 漢字表示をリセット
        hiraganaDisplayElement.textContent = '';           // ひらがな表示をリセット
        romajiTargetElement.value = '';                    // 色付きローマ字ターゲットをリセット
        romajiTargetElement.innerHTML = '';                // 色付きローマ字ターゲットのHTMLをリセット
        resultElement.textContent = '';                    // 結果表示をリセット
        timerElement.classList.add('countdown');           // タイマーにカウントダウンクラスを追加してスタイルを変更

        // カウントダウンの開始
        let count = 3;                    // カウントダウンの初期値
        timerElement.textContent = count; // タイマーにカウントダウンの数字を表示

        // 1秒ごとにカウントダウンを更新するタイマーを開始
        // 1000msごとにカウントを1減らし、0になったらゲームを開始する。
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

        // ゲーム開始前にサーバーからトークンを取得する処理
        try {
            // サーバーのトークン発行APIを叩く（URLは環境に合わせてください）
            const response = await fetch('/api/start-game', { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                gameToken = data.token; // サーバーが作ったハッシュを保持
            } else {
                alert('通信エラーが発生しました。ページをリロードしてください。');
                return; // トークンが取れなければゲームを開始させない
            }
        } catch (error) {
            console.error('通信エラー', error);
            alert('サーバーとの通信に失敗しました。');
            return;
        }
    }

    // - ゲーム開始処理
    function startGame() {

        // ゲーム状態を初期化して開始
        isGameRunning = true;                                     // ゲーム状態を「実行中」に設定
        startButton.textContent = '終了';                         // スタートボタンのテキストを「終了」に変更
        startButton.classList.add('end-game-button');             // スタートボタンに終了用のクラスを追加してスタイルを変更
        startButton.disabled = false;                             // スタートボタンを有効化
        startButton.removeEventListener('click', startCountdown); // スタートボタンのカウントダウン開始イベントをリセット
        startButton.removeEventListener('click', endGameEarly);   // スタートボタンの終了イベントをリセット
        startButton.addEventListener('click', endGameEarly);      // スタートボタンにゲーム終了イベントを追加
        timerElement.textContent = `残り時間: ${timeLeft}秒`;      // タイマーに残り時間を表示
        
        // ゲーム開始時間を記録（最初のキー入力があるまで0のまま）
        if (gameStartTime === 0) {
            gameStartTime = new Date().getTime();
        }
        
        // お題をランダムに表示する関数を呼び出す
        RandomPick();
        
        // もし既にゲームタイマーが動いていたらリセットする
        if (gameTimerId) {
            clearInterval(gameTimerId);
        }
        
        // ゲームタイマーを開始して、1秒ごとに残り時間を更新する
        gameTimerId = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) timeLeft = 0;
            timerElement.textContent = `残り時間: ${timeLeft}秒`;
            if (timeLeft <= 0) {
                gameOver(); // 時間切れの場合はランキングに不送信
            }
        }, 1000);
        romajiTargetElement.disabled = false; // 入力を有効化
        romajiTargetElement.focus();          // 入力欄にフォーカス
    }


    // 色の更新を担当する関数
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
                color = '#002fff';            // 次に打つ文字
            }
            newHtml += `<span style="color: ${color};">${char}</span>`;
        }
        romajiTargetElement.innerHTML = newHtml; // 色付きローマ字ターゲットのHTMLを更新
    }


    // -------------------------------------------------------------------------
    // - キー入力イベントリスナー 
    // -------------------------------------------------------------------------
    document.addEventListener('keydown', (event) => {

        // ゲームが実行中でない場合はキー入力を無視
        if (!isGameRunning) return;

        // 特殊キーやCtrl/Alt/Metaキーとの組み合わせは無視
        if (event.key.length > 1 && event.key !== ' ' && !event.ctrlKey && !event.altKey && !event.metaKey) {
            return; 
        }

        // 入力されたキーを取得
        const pressedKey = event.key;

        // ▼▼▼▼▼▼▼▼▼▼▼▼ 万能変換ロジック開始 ▼▼▼▼▼▼▼▼▼▼▼▼
        if (currentIndex < inputString.length) {

            // 現在の入力位置から残りの文字列を取得
            const remainingText = inputString.substring(currentIndex);
        
            // 変換ルールの定義（mainが標準、altが変換後の文字列）
            const conversions = [
                // --- H行 (hi <-> shi, ha <-> sya 等) ---
                { main: 'ti',  alt: 'chi' },
                { main: 'tu',  alt: 'tsu' },
                { main: 'hu',  alt: 'fu' },
                { main: 'zi',  alt: 'ji' },
                { main: 'ka',  alt: 'ca' }, { main: 'ku',  alt: 'cu' }, { main: 'ko',  alt: 'co' },
                { main: 'se',  alt: 'ce' },
                { main: 'si',  alt: 'ci' }, { main: 'shi', alt: 'ci' },
                { main: 'tya', alt: 'cha' }, { main: 'tyu', alt: 'chu' }, { main: 'tyo', alt: 'cho' },
                { main: 'tya', alt: 'cya' }, { main: 'tyu', alt: 'cyu' }, { main: 'tyo', alt: 'cyo' },
                { main: 'cha', alt: 'cya' }, { main: 'chu', alt: 'cyu' }, { main: 'cho', alt: 'cyo' },
                { main: 'zya', alt: 'ja' },  { main: 'zyu', alt: 'ju' },  { main: 'zyo', alt: 'jo' },
                { main: 'jya', alt: 'ja' },  { main: 'jyu', alt: 'ju' },  { main: 'jyo', alt: 'jo' }
            ];

            // 変換ルールを順番にチェックして、変換が必要な場合は inputString を更新して表示を更新する
            for (const conv of conversions) {
                if (conv.main[0] === conv.alt[0]) {
                    continue;
                }

                if (remainingText.startsWith(conv.main) && pressedKey === conv.alt[0]) {
                    inputString = inputString.substring(0, currentIndex) + conv.alt + inputString.substring(currentIndex + conv.main.length);
                    updateDisplay();
                    break;
                }
                if (remainingText.startsWith(conv.alt) && pressedKey === conv.main[0]) {
                    inputString = inputString.substring(0, currentIndex) + conv.main + inputString.substring(currentIndex + conv.alt.length);
                    updateDisplay();
                    break;
                }
            }
        }

        // 2文字目以降で、直前の文字と組み合わせて変換するパターンを処理するためのロジック
        if (currentIndex > 0 && currentIndex < inputString.length) {

            // 現在の入力位置から残りの文字列を取得
            const remainingText = inputString.substring(currentIndex);
            const prevChar = inputString[currentIndex - 1]; // 直前の文字を取得

            // 変換ルールの定義（mainが標準、altが変換後の文字列）
            const rules = [
                // --- S行 (si <-> shi, sha <-> sya) ---
                { prev: 's', target: 'i',  input: 'h', replace: 'hi' }, 
                { prev: 's', target: 'hi', input: 'i', replace: 'i'  }, 
                { prev: 's', target: 'ya', input: 'h', replace: 'ha' }, 
                { prev: 's', target: 'ha', input: 'y', replace: 'ya' }, 
                { prev: 's', target: 'yu', input: 'h', replace: 'hu' }, 
                { prev: 's', target: 'hu', input: 'y', replace: 'yu' }, 
                { prev: 's', target: 'yo', input: 'h', replace: 'ho' }, 
                { prev: 's', target: 'ho', input: 'y', replace: 'yo' }, 

                // --- T行 (tu <-> tsu) ---
                { prev: 't', target: 'u',  input: 's', replace: 'su' }, 
                { prev: 't', target: 'su', input: 'u', replace: 'u'  }, 

                // --- J行 (ja <-> jya, ju <-> jyu, jo <-> jyo) ---
                { prev: 'j', target: 'a',  input: 'y', replace: 'ya' }, 
                { prev: 'j', target: 'u',  input: 'y', replace: 'yu' }, 
                { prev: 'j', target: 'o',  input: 'y', replace: 'yo' }, 
                { prev: 'j', target: 'ya', input: 'a', replace: 'a'  }, 
                { prev: 'j', target: 'yu', input: 'u', replace: 'u'  }, 
                { prev: 'j', target: 'yo', input: 'o', replace: 'o'  }, 
                
                // --- C行 (cha <-> cya 等) ---
                { prev: 'c', target: 'ha', input: 'y', replace: 'ya' },
                { prev: 'c', target: 'hu', input: 'y', replace: 'yu' },
                { prev: 'c', target: 'ho', input: 'y', replace: 'yo' },
                { prev: 'c', target: 'ya', input: 'h', replace: 'ha' },
                { prev: 'c', target: 'yu', input: 'h', replace: 'hu' },
                { prev: 'c', target: 'yo', input: 'h', replace: 'ho' },
            ];

            // 変換ルールを順番にチェックして、変換が必要な場合は inputString を更新して表示を更新する
            for (const rule of rules) {
                if (prevChar === rule.prev && remainingText.startsWith(rule.target) && pressedKey === rule.input) {
                    inputString = inputString.substring(0, currentIndex) + rule.replace + inputString.substring(currentIndex + rule.target.length);
                    updateDisplay();
                    break;
                }
            }
        }
        
        // 直前の文字が 'n' で、次の文字が母音や 'y' でない場合に、さらに 'n' を入力することで「ん」を表現できるようにするロジック
        if (currentIndex > 0 && currentIndex < inputString.length) {
            const prevChar = inputString[currentIndex - 1]; // 直前の文字を取得
            const nextChar = inputString[currentIndex];     // 次の文字を取得

            // 2つ前の文字を取得（ない場合は空文字）
            const prevPrevChar = currentIndex > 1 ? inputString[currentIndex - 2] : ''; 

            // 直前が 'n' かつ「2つ前が 'n' ではない（まだnnになっていない）」場合のみ許可
            if (prevChar === 'n' && prevPrevChar !== 'n' && pressedKey === 'n') {
                const isVowelOrYOrN = ['a', 'i', 'u', 'e', 'o', 'y', 'n'].includes(nextChar);
                
                if (!isVowelOrYOrN) {
                    inputString = inputString.substring(0, currentIndex) + 'n' + inputString.substring(currentIndex);
                    updateDisplay();
                }
            }
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲ 万能変換ロジック終了 ▲▲▲▲▲▲▲▲▲▲▲▲

        
        // 文字キーが押された場合のみ処理
        if (pressedKey.length === 1 || pressedKey === ' ') {
            event.preventDefault(); // デフォルト動作キャンセル
            
            totalKeyStrokes++;      // キータイプ数をカウント

            // 現在の入力位置の文字と押されたキーを比較
            const targetChar = inputString[currentIndex];

            // もし正解なら、正解数をカウントして次の文字に進む
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

        // ゲームが実行中であれば、ユーザーに確認してからゲームを終了する
        if (isGameRunning && confirm('測定を中止しますか？')) {
            clearInterval(gameTimerId);          // タイマーを停止
            isGameRunning = false;               // 入力を無効化
            romajiTargetElement.disabled = true; // 入力を無効化

            // スコア計算
            gameEndTime = new Date().getTime(); // ゲーム開始から終了までの時間を秒単位で計算
            const totalGameDuration = (gameEndTime - gameStartTime) / 1000; // ゲーム全体での正しく打ったキー数をスコアとして使用
            const scoreCorrectKeyStrokes = correctKeyStrokes;               // ゲーム全体での正しく打ったキー数をスコアとして使用
            const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0; // 正答率を計算
            const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;          // TPSを計算
            const totalCorrectInput = scoreCorrectKeyStrokes;

            // 結果表示
            resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
            messageElement.textContent = '測定を中止しました。';
            messageElement.style.color = '#d9534f';

            // UIをリセット
            startButton.disabled = false;
            startButton.textContent = 'もう一度プレイ';
            startButton.classList.remove('end-game-button');          // スタートボタンのクラスをリセット
            startButton.removeEventListener('click', startCountdown); // スタートボタンのクリックイベントをリセット
            startButton.removeEventListener('click', endGameEarly);   // スタートボタンのクリックイベントをリセット
            startButton.addEventListener('click', startCountdown);    // スタートボタンにカウントダウン開始イベントを追加
            
            // ゲーム状態を初期化
            gameStartTime = 0;      // ゲーム開始時間をリセット
            timeLeft = initialTime; // タイマーをリセット
            timerElement.textContent = `残り時間: ${timeLeft}秒`;
        }
    }


    // - ゲームオーバー処理
    function gameOver() {

        // ゲームタイマーを停止して、ゲーム状態を「実行中でない」に設定
        clearInterval(gameTimerId);
        isGameRunning = false;

        startButton.disabled = false;                    // スタートボタンを有効化
        startButton.textContent = 'もう一度プレイ';       // スタートボタンのテキストを「もう一度プレイ」に変更
        startButton.classList.remove('end-game-button'); // スタートボタンのクラスをリセット

        startButton.removeEventListener('click', startCountdown); // スタートボタンのクリックイベントをリセット
        startButton.removeEventListener('click', endGameEarly);   // スタートボタンのクリックイベントをリセット
        startButton.addEventListener('click', startCountdown);    // スタートボタンにカウントダウン開始イベントを追加

        // ゲーム終了時間を記録して、ゲーム全体の正しく打ったキー数をスコアとして使用
        gameEndTime = new Date().getTime(); 
        const totalGameDuration = (gameEndTime - gameStartTime) / 1000;
        
        // スコア計算
        const scoreCorrectKeyStrokes = correctKeyStrokes; // ゲーム全体での正しく打ったキー数をスコアとして使用
        const accuracy = totalKeyStrokes > 0 ? ((scoreCorrectKeyStrokes / totalKeyStrokes) * 100).toFixed(2) : 0; // 正答率を計算
        const tps = totalGameDuration > 0 ? (scoreCorrectKeyStrokes / totalGameDuration).toFixed(2) : 0;          // TPSを計算
        const totalCorrectInput = scoreCorrectKeyStrokes; // ゲーム全体での正しく打ったキー数をスコアとして使用

        // 結果表示
        resultElement.textContent = `最終結果: 正答率 ${accuracy}%, TPS ${tps}, 正解タイプ数 ${totalCorrectInput}回`;
        
        // ユーザーへのメッセージ
        messageElement.textContent = 'お疲れ様です。データを保存します。';
        messageElement.style.color = '#d9534f';

        // スコアデータだけを送信
        postRanking({ 
            accuracy: accuracy, 
            tps: tps, 
            correct_strokes: totalCorrectInput,
            token: gameToken
        });
        
        gameStartTime = 0; 
        gameToken = ''; // 使い終わったトークンはリセットして再利用を防ぐ
    }

    // - ランキングデータをバックエンドに送信する関数
    function postRanking(score) {
        // APIにスコアデータを送信するためのPOSTリクエストを作成
        fetch('/api/rankings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accuracy: parseFloat(score.accuracy),
                tps: parseFloat(score.tps),
                correct_strokes: score.correct_strokes,
                token: score.token
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

        // APIからランキングデータを取得
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

            //「あなたの現在のランク」の表示処理
            if (myRankData && myRankContainer) {

                // データがあれば表示オン
                myRankContainer.style.display = 'block';

                // 各項目に値をセット
                myRankDisplay.textContent = myRankData.rank;
                myStrokesDisplay.textContent = myRankData.correct_strokes;
                myTpsDisplay.textContent = myRankData.tps;
                myAccuracyDisplay.textContent = myRankData.accuracy + '%';
            } else {

                // データがなければ（ランク外または未プレイ）非表示
                if (myRankContainer) {
                    myRankContainer.style.display = 'none';
                }
            }

            // ランキングリスト（TOP 300）の表示処理
            rankListElement.innerHTML = '';

            // ランキングデータがない場合の処理
            if (!rankings || rankings.length === 0) {
                rankListElement.innerHTML = '<li>まだランキングはありません。</li>';
                return;
            }

            // ランキングデータがある場合の処理
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

    // - ページが読み込まれたときにゲームを初期化する
    initializeGame();
});