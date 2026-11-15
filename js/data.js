/* テンプレート、デザイン、書体。ビルドせず、このファイルをそのまま読み込む。 */
(function () {
  const GOTHIC = '"Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
  const MINCHO = '"Yu Mincho", "Hiragino Mincho ProN", serif';

  function font(entry) {
    const fallback = entry.fallback || (entry.mincho ? MINCHO : GOTHIC);
    return {
      id: entry.id,
      name: entry.name,
      group: entry.group,
      family: entry.local || ('"' + entry.name + '", ' + fallback),
      google: entry.google || "",
      labelWeight: entry.labelWeight,
      valueWeight: entry.valueWeight,
      decorative: !!entry.decorative,
    };
  }

  const FONTS = [
    font({ id: "noto-sans", name: "Noto Sans JP", group: "ゴシック", google: "Noto+Sans+JP:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "zen-kaku", name: "Zen Kaku Gothic New", group: "ゴシック", google: "Zen+Kaku+Gothic+New:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "mplus", name: "M PLUS 1", group: "ゴシック", google: "M+PLUS+1:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "ibm-plex", name: "IBM Plex Sans JP", group: "ゴシック", google: "IBM+Plex+Sans+JP:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "biz-gothic", name: "BIZ UDPGothic", group: "ゴシック", google: "BIZ+UDPGothic:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "sawarabi-gothic", name: "Sawarabi Gothic", group: "ゴシック", google: "Sawarabi+Gothic", labelWeight: 400, valueWeight: 400 }),

    font({ id: "zen-maru", name: "Zen Maru Gothic", group: "丸ゴシック", google: "Zen+Maru+Gothic:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "mplus-round", name: "M PLUS Rounded 1c", group: "丸ゴシック", google: "M+PLUS+Rounded+1c:wght@400;700", labelWeight: 700, valueWeight: 400 }),
    font({ id: "kiwi", name: "Kiwi Maru", group: "丸ゴシック", google: "Kiwi+Maru:wght@400;500", labelWeight: 500, valueWeight: 400 }),
    font({ id: "kosugi-maru", name: "Kosugi Maru", group: "丸ゴシック", google: "Kosugi+Maru", labelWeight: 400, valueWeight: 400 }),

    font({ id: "noto-serif", name: "Noto Serif JP", group: "明朝", google: "Noto+Serif+JP:wght@400;700", labelWeight: 700, valueWeight: 400, mincho: true }),
    font({ id: "shippori", name: "Shippori Mincho", group: "明朝", google: "Shippori+Mincho:wght@500;700", labelWeight: 700, valueWeight: 500, mincho: true }),
    font({ id: "zen-old", name: "Zen Old Mincho", group: "明朝", google: "Zen+Old+Mincho:wght@500;700", labelWeight: 700, valueWeight: 500, mincho: true }),
    font({ id: "biz-mincho", name: "BIZ UDPMincho", group: "明朝", google: "BIZ+UDPMincho:wght@400;700", labelWeight: 700, valueWeight: 400, mincho: true }),
    font({ id: "kaisei-decol", name: "Kaisei Decol", group: "明朝", google: "Kaisei+Decol:wght@400;700", labelWeight: 700, valueWeight: 400, mincho: true }),
    font({ id: "kaisei-opti", name: "Kaisei Opti", group: "明朝", google: "Kaisei+Opti:wght@400;700", labelWeight: 700, valueWeight: 400, mincho: true }),
    font({ id: "sawarabi-mincho", name: "Sawarabi Mincho", group: "明朝", google: "Sawarabi+Mincho", labelWeight: 400, valueWeight: 400, mincho: true }),
    font({ id: "shippori-antique", name: "Shippori Antique", group: "明朝", google: "Shippori+Antique", labelWeight: 400, valueWeight: 400, mincho: true }),
    font({ id: "hina", name: "Hina Mincho", group: "明朝", google: "Hina+Mincho", labelWeight: 400, valueWeight: 400, mincho: true }),

    font({ id: "klee", name: "Klee One", group: "手書き・装飾", google: "Klee+One:wght@400;600", labelWeight: 600, valueWeight: 400, decorative: true }),
    font({ id: "kurenaido", name: "Zen Kurenaido", group: "手書き・装飾", google: "Zen+Kurenaido", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "yusei", name: "Yusei Magic", group: "手書き・装飾", google: "Yusei+Magic", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "hachi", name: "Hachi Maru Pop", group: "手書き・装飾", google: "Hachi+Maru+Pop", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "zen-antique", name: "Zen Antique", group: "手書き・装飾", google: "Zen+Antique", labelWeight: 400, valueWeight: 400, decorative: true, mincho: true }),
    font({ id: "potta", name: "Potta One", group: "手書き・装飾", google: "Potta+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "dela", name: "Dela Gothic One", group: "手書き・装飾", google: "Dela+Gothic+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "rocknroll", name: "RocknRoll One", group: "手書き・装飾", google: "RocknRoll+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "rampart", name: "Rampart One", group: "手書き・装飾", google: "Rampart+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "reggae", name: "Reggae One", group: "手書き・装飾", google: "Reggae+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "dot", name: "DotGothic16", group: "手書き・装飾", google: "DotGothic16", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "train", name: "Train One", group: "手書き・装飾", google: "Train+One", labelWeight: 400, valueWeight: 400, decorative: true }),
    font({ id: "stick", name: "Stick", group: "手書き・装飾", google: "Stick", labelWeight: 400, valueWeight: 400, decorative: true }),

    font({ id: "yu-gothic", name: "游ゴシック", group: "この端末の書体", google: "", labelWeight: 700, valueWeight: 400, local: '"Yu Gothic Medium", "Yu Gothic", YuGothic, Meiryo, sans-serif' }),
    font({ id: "yu-mincho", name: "游明朝", group: "この端末の書体", google: "", labelWeight: 700, valueWeight: 400, local: '"Yu Mincho", YuMincho, "Hiragino Mincho ProN", serif', mincho: true }),
    font({ id: "meiryo", name: "メイリオ", group: "この端末の書体", google: "", labelWeight: 700, valueWeight: 400, local: "Meiryo, sans-serif" }),
    font({ id: "hiragino-sans", name: "ヒラギノ角ゴ", group: "この端末の書体", google: "", labelWeight: 700, valueWeight: 400, local: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif' }),
    font({ id: "hiragino-min", name: "ヒラギノ明朝", group: "この端末の書体", google: "", labelWeight: 700, valueWeight: 400, local: '"Hiragino Mincho ProN", "Yu Mincho", serif', mincho: true }),
  ];

  const CATEGORIES = [
    { id: "basic", name: "基本", blurb: "誰であるか" },
    { id: "work", name: "仕事・学校", blurb: "日中の顔" },
    { id: "person", name: "人となり", blurb: "性格と価値観" },
    { id: "likes", name: "好き", blurb: "心が動くもの" },
    { id: "life", name: "日常", blurb: "ふだんの時間" },
    { id: "future", name: "これから", blurb: "目標と願い" },
    { id: "contact", name: "つながり", blurb: "話し方と連絡" },
    { id: "custom", name: "自由記入", blurb: "自分で足した欄" },
  ];

  function field(entry) {
    return {
      id: entry.id,
      category: entry.category,
      label: entry.label,
      placeholder: entry.placeholder,
      hint: entry.hint,
      multiline: !!entry.multiline,
      wide: !!entry.wide,
      slot: entry.slot || "",
    };
  }

  const TEMPLATES = [
    field({ id: "furigana", category: "basic", label: "ふりがな", placeholder: "あおば みのり", hint: "名前の上に、小さく出ます", slot: "kana" }),
    field({ id: "nickname", category: "basic", label: "ニックネーム", placeholder: "みのりん", hint: "名前の下に、小さな札で出ます", slot: "nick" }),
    field({ id: "catch", category: "basic", label: "一言紹介", placeholder: "紙と光と、朝ごはんが好きです。", hint: "名前の近くに出る、短い紹介文です", slot: "catch", multiline: true }),
    field({ id: "age", category: "basic", label: "年齢", placeholder: "23", hint: "数字だけでも、○歳でも" }),
    field({ id: "birthday", category: "basic", label: "生年月日", placeholder: "2002年5月12日", hint: "年まで出すかはお任せで" }),
    field({ id: "pronouns", category: "basic", label: "性別・呼び方", placeholder: "女性。さん付けでも名前でも", hint: "呼ばれたい名前や、使ってほしい言葉" }),
    field({ id: "blood", category: "basic", label: "血液型", placeholder: "O型", hint: "わからない、でも大丈夫です" }),
    field({ id: "zodiac", category: "basic", label: "星座", placeholder: "牡牛座", hint: "干支でも、星座でも" }),
    field({ id: "height", category: "basic", label: "身長", placeholder: "157cm", hint: "出したくなければ、この欄は足さなくて大丈夫" }),
    field({ id: "birthplace", category: "basic", label: "出身地", placeholder: "静岡県", hint: "町の名前まででも、国の名前でも" }),
    field({ id: "lives", category: "basic", label: "住んでいるところ", placeholder: "京都市", hint: "今いる街。番地は書かなくて大丈夫" }),
    field({ id: "languages", category: "basic", label: "話せる言語", placeholder: "日本語。英語はメニューが読めるくらい", hint: "あいさつ程度、も立派な情報です" }),

    field({ id: "job", category: "work", label: "職業・肩書き", placeholder: "グラフィックデザイナー", hint: "名前の下に出ます。学生なら学年でも", slot: "role" }),
    field({ id: "org", category: "work", label: "所属", placeholder: "スタジオ紙吹雪", hint: "学校、会社、サークル。名前の下に出ます", slot: "org" }),
    field({ id: "position", category: "work", label: "学年・役職", placeholder: "デザイン3年 / 印刷担当", hint: "肩書きより細かい立場" }),
    field({ id: "major", category: "work", label: "専攻・担当", placeholder: "印刷物とパッケージ", hint: "いま手を動かしている領域" }),
    field({ id: "history", category: "work", label: "これまで", placeholder: "短大を出て、印刷会社を経て今の仕事に。", hint: "長い経歴は、幅いっぱいに出ます", multiline: true, wide: true }),
    field({ id: "skills", category: "work", label: "できること", placeholder: "Illustrator、写真のレタッチ、段取り", hint: "仕事の技能でも、生活の技能でも", multiline: true, wide: true }),
    field({ id: "licenses", category: "work", label: "資格・免許", placeholder: "色彩検定2級、普通自動車", hint: "持っているもの、勉強中のもの" }),

    field({ id: "pr", category: "person", label: "自己PR", placeholder: "はじめての人にも、昔からの友達にも、同じ温度で話します。", hint: "カードの中で、いちばん自由な紹介文です", multiline: true, wide: true }),
    field({ id: "personality", category: "person", label: "性格", placeholder: "おだやかで、好きなことには細かい", hint: "自分で思う性格で大丈夫です" }),
    field({ id: "mbti", category: "person", label: "タイプ", placeholder: "INFP", hint: "MBTI、動物占い、血液型性格。空欄でも可" }),
    field({ id: "strength", category: "person", label: "長所", placeholder: "人の話を最後まで聞ける", hint: "ひとつで十分伝わります" }),
    field({ id: "weakness", category: "person", label: "短所", placeholder: "返事をためこむことがある", hint: "親しみは、短所から出ることもあります" }),
    field({ id: "values", category: "person", label: "価値観", placeholder: "急がないこと。でも、約束は守る。", hint: "判断のときに立ち返ること", multiline: true, wide: true }),
    field({ id: "motto", category: "person", label: "座右の銘", placeholder: "急がば回れ", hint: "好きな言葉でも" }),
    field({ id: "treasure", category: "person", label: "大切にしていること", placeholder: "ご飯を一緒に食べること", hint: "人でも、習慣でも、場所でも" }),
    field({ id: "reputation", category: "person", label: "人からよく言われること", placeholder: "声がおだやか、と言われる", hint: "自分では気づきにくい顔です" }),
    field({ id: "phrase", category: "person", label: "口癖", placeholder: "いったん考えさせて", hint: "よく出る一言" }),
    field({ id: "impression", category: "person", label: "初対面の自分", placeholder: "おとなしいと思われがち", hint: "あとから「違う」と言われる点でも" }),
    field({ id: "refresh", category: "person", label: "リフレッシュ方法", placeholder: "散歩して、パンを買う", hint: "調子が悪い日の戻り方" }),
    field({ id: "respect", category: "person", label: "尊敬する人", placeholder: "祖母。段取りが美しい。", hint: "有名人でも、近くの人でも" }),

    field({ id: "hobby", category: "likes", label: "趣味", placeholder: "フィルム写真、古本屋、パン作り", hint: "夢中になっていること" }),
    field({ id: "talent", category: "likes", label: "特技", placeholder: "人の好きな色を覚えること", hint: "小さくても、自分だけの上手さ" }),
    field({ id: "food", category: "likes", label: "好きな食べ物", placeholder: "だし巻き卵、桃、カレー", hint: "苦手とセットだと、食事が決めやすい" }),
    field({ id: "hatefood", category: "likes", label: "苦手な食べ物", placeholder: "セロリ", hint: "アレルギーがあるなら、ここに書けます" }),
    field({ id: "color", category: "likes", label: "好きな色", placeholder: "生成りと朱色", hint: "服でも、景色でも" }),
    field({ id: "music", category: "likes", label: "好きな音楽", placeholder: "シティポップ、ピアノトリオ", hint: "曲名でも、聴き方でも" }),
    field({ id: "movie", category: "likes", label: "好きな映画・ドラマ", placeholder: "小さな食堂が出てくる話", hint: "ジャンルだけでも伝わります" }),
    field({ id: "book", category: "likes", label: "好きな本・漫画", placeholder: "エッセイと、料理漫画", hint: "最近よかった一冊でも" }),
    field({ id: "game", category: "likes", label: "好きなゲーム", placeholder: "まちあるきと、パズル", hint: "やらない、でも回答になります" }),
    field({ id: "place", category: "likes", label: "好きな場所", placeholder: "川沿いの古本屋", hint: "店でも、座席でも、天気でも" }),
    field({ id: "season", category: "likes", label: "好きな季節", placeholder: "10月の終わり", hint: "月や、時間帯でも" }),
    field({ id: "animal", category: "likes", label: "好きな動物", placeholder: "黒猫と、スズメ", hint: "実在しなくても大丈夫" }),
    field({ id: "oshi", category: "likes", label: "推し", placeholder: "書店員さんおすすめの作家", hint: "人、作品、店。熱量の置き場" }),
    field({ id: "fashion", category: "likes", label: "服装の好み", placeholder: "シャツと、歩きやすい靴", hint: "会ったときに探す目印にもなります" }),
    field({ id: "scent", category: "likes", label: "好きな香り", placeholder: "パンが焼ける匂い", hint: "匂いの記憶は、その人らしさが出ます" }),

    field({ id: "rhythm", category: "life", label: "朝型・夜型", placeholder: "夜型。朝ごはんは抜かない", hint: "予定を合わせるときの手がかり" }),
    field({ id: "holiday", category: "life", label: "休日の過ごし方", placeholder: "午前は寝て、午後は電車に乗る。", hint: "理想の一日でも、実際の一日でも", multiline: true, wide: true }),
    field({ id: "into", category: "life", label: "最近ハマっていること", placeholder: "フィルムを自分で現像すること", hint: "今この数週間の話" }),
    field({ id: "boom", category: "life", label: "マイブーム", placeholder: "白湯と、図書館の自習室", hint: "小さな流行で大丈夫" }),
    field({ id: "cooking", category: "life", label: "得意料理", placeholder: "味噌汁、卵焼き、炊き込みご飯", hint: "作れなくても、好きな店で代用可" }),
    field({ id: "breakfast", category: "life", label: "朝ごはん", placeholder: "ごはんと味噌と卵", hint: "食べない、も性格が出ます" }),
    field({ id: "drink", category: "life", label: "よく飲むもの", placeholder: "午前はコーヒー、午後はほうじ茶", hint: "お酒でも、水でも" }),
    field({ id: "petperson", category: "life", label: "猫派・犬派", placeholder: "猫派。犬は友達", hint: "どちらでもない、も選べます" }),
    field({ id: "indoor", category: "life", label: "インドア・アウトドア", placeholder: "インドア7、外歩き3", hint: "割合で書くと具体的です" }),
    field({ id: "collection", category: "life", label: "集めているもの", placeholder: "紙のコースター、古い葉書", hint: "コレクションは、その人の棚です" }),
    field({ id: "pet", category: "life", label: "ペット", placeholder: "いない。いつか黒猫", hint: "名前があると、カードが急に近くなります" }),
    field({ id: "habit", category: "life", label: "おきにいりの習慣", placeholder: "寝る前に1ページ読む", hint: "毎日ではなくても" }),
    field({ id: "commute", category: "life", label: "移動手段", placeholder: "自転車と地下鉄", hint: "よくいる場所の想像がつきます" }),

    field({ id: "dream", category: "future", label: "夢・目標", placeholder: "小さな活版の工房を持つこと", hint: "遠い話ほど、人柄が出ます", multiline: true, wide: true }),
    field({ id: "thisyear", category: "future", label: "今年やりたいこと", placeholder: "知らない街で朝ごはんを食べる", hint: "一年のサイズの願い" }),
    field({ id: "challenge", category: "future", label: "いま挑戦していること", placeholder: "文章を毎週書く", hint: "途中でも、書けます" }),
    field({ id: "wish", category: "future", label: "もしも願いが叶うなら", placeholder: "会いたい人に、ちょうどいい日に会う", hint: "大きな願いでも、小さな願いでも" }),
    field({ id: "island", category: "future", label: "無人島に持っていくなら", placeholder: "ナイフと、分厚いエッセイ", hint: "定番の質問ほど、差が出ます" }),
    field({ id: "learning", category: "future", label: "いま学んでいること", placeholder: "英文のレシピを読むこと", hint: "学校の勉強だけじゃなくて" }),
    field({ id: "gift", category: "future", label: "もらってうれしいもの", placeholder: "手紙と、季節の果物", hint: "プレゼントを考える人の助けになります" }),

    field({ id: "hours", category: "contact", label: "連絡しやすい時間", placeholder: "平日20時以降、土日の昼", hint: "返事が来る時間の目安" }),
    field({ id: "talk", category: "contact", label: "話し方の好み", placeholder: "はじめは丁寧に。慣れたらタメ口歓迎", hint: "距離の取り方を、先に渡せます" }),
    field({ id: "sns", category: "contact", label: "SNS", placeholder: "@minori.paper", hint: "出してよいアカウントだけ" }),
    field({ id: "web", category: "contact", label: "ウェブサイト", placeholder: "https://example.com", hint: "作品や日記の置き場" }),
    field({ id: "contact", category: "contact", label: "公開してよい連絡先", placeholder: "hello@example.com", hint: "カードに載せてよいアドレスだけ" }),
    field({ id: "topic", category: "contact", label: "振ってほしい話題", placeholder: "最近食べたパン、おすすめの本屋", hint: "会話の入口を、相手に渡せます" }),
    field({ id: "ng", category: "contact", label: "苦手な話題", placeholder: "体型の話と、突然の電話", hint: "書ける範囲で。無理に詳しくしなくて大丈夫", multiline: true, wide: true }),
  ];

  const THEMES = [
    { id: "washi", name: "和紙", description: "生成りの紙と朱色", layout: "center", photoShape: "circle", swatch: { bg: "#f7f1e5", ink: "#2c241e", accent: "#c44536", label: "#8d3d32", value: "#2c241e", name: "#241c17" } },
    { id: "modern", name: "モダン", description: "余白と青い軸", layout: "side", photoShape: "rounded", swatch: { bg: "#ffffff", ink: "#1c1917", accent: "#2f4f9a", label: "#5c6478", value: "#1c1917", name: "#15171d" } },
    { id: "pop", name: "ポップ", description: "太い線と丸い色", layout: "center", photoShape: "circle", swatch: { bg: "#fff4e8", ink: "#1c1917", accent: "#e23d6b", label: "#e23d6b", value: "#1c1917", name: "#1c1917" } },
    { id: "midnight", name: "ミッドナイト", description: "夜の金", layout: "center", photoShape: "circle", swatch: { bg: "#141821", ink: "#f7f4ee", accent: "#e6c98a", label: "#e6c98a", value: "#f7f4ee", name: "#f3e6c4" } },
    { id: "business", name: "ビジネス", description: "紺の帯がある名刺", layout: "side", photoShape: "rounded", swatch: { bg: "#ffffff", ink: "#1f2933", accent: "#1b3358", label: "#1b3358", value: "#243140", name: "#ffffff" } },
    { id: "editorial", name: "誌面", description: "大きな写真と黒", layout: "cover", photoShape: "bleed", swatch: { bg: "#fafafa", ink: "#111111", accent: "#d12323", label: "#d12323", value: "#1a1a1a", name: "#111111" } },
    { id: "notebook", name: "ノート", description: "罫線と赤の余白", layout: "side", photoShape: "rounded", swatch: { bg: "#fffef8", ink: "#243044", accent: "#d65c5c", label: "#3d6f99", value: "#243044", name: "#243044" } },
    { id: "sakura", name: "桜", description: "うすい桃とアーチ", layout: "center", photoShape: "arch", swatch: { bg: "#fff5f7", ink: "#3d2a32", accent: "#d46a8a", label: "#b85a78", value: "#3d2a32", name: "#4a2433" } },
    { id: "forest", name: "森", description: "深い緑と生成り", layout: "side", photoShape: "rounded", swatch: { bg: "#1a332b", ink: "#f3efe4", accent: "#d7c4a3", label: "#d7c4a3", value: "#f3efe4", name: "#f7f3e8" } },
    { id: "neon", name: "ネオン", description: "黒地に光る線", layout: "side", photoShape: "circle", swatch: { bg: "#0e0f16", ink: "#f4f7ff", accent: "#2de2e6", label: "#2de2e6", value: "#f4f7ff", name: "#ffffff" } },
    { id: "retro", name: "レトロ", description: "オレンジと太い枠", layout: "side", photoShape: "square", swatch: { bg: "#f6d7a7", ink: "#1a1a1a", accent: "#0f6e6e", label: "#0f6e6e", value: "#1a1a1a", name: "#1a1a1a" } },
    { id: "mint", name: "ミント", description: "薄い緑の白い欄", layout: "side", photoShape: "circle", swatch: { bg: "#e7f6f1", ink: "#14332e", accent: "#0f766e", label: "#0f766e", value: "#14332e", name: "#102824" } },
  ];

  window.CARD_DATA = {
    CATEGORIES: CATEGORIES,
    TEMPLATES: TEMPLATES,
    THEMES: THEMES,
    FONTS: FONTS,
  };
})();
