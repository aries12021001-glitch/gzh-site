// 网站内容数据：12 个方向、9 步流程、每日分工、折纸皮肤
const DIRS = [
 {id:"minsheng", ch:"钱", c:"sun", name:"民生钱袋子", hot:2, level:"适中", lv:"ok", ready:true,
  one:"社保、公积金、补贴、维权、省钱。帮普通家庭把该领的钱领到手。",
  who:"愿意查政策原文、会算账、表达直白的人",
  red:["政策和数字以官方发布为准，每条都注明出处","不编造个人经历，不冒充律师、会计等有资质的身份","标题悬念必须在正文兑现"],
  kw:"社保、养老金、医保、公积金、个税、退休、工资、存款利率、金价、油价、消费维权、补贴",
  example:"苹果最终确认！向每位用户最高赔 637 元（10万+）"},
 {id:"health", ch:"健", c:"mint", name:"健康科普辟谣", hot:2, level:"难", lv:"bad",
  one:"常见健康误区、体检解读、谣言澄清。",
  who:"有医学、护理、营养等相关背景的人",
  red:["不能宣传疗效、推荐药品或保健品治病（广告法和医疗广告管理规定）","不冒充医生；辟谣要引用卫健委、疾控等权威机构","没有专业背景很难做出可信内容"],
  kw:"养生、辟谣、体检", example:"我妈在小区水站充了500块……第二天早上数字剩90（9.5万）"},
 {id:"emotion", ch:"情", c:"coral", name:"情感家庭", hot:2, level:"适中", lv:"ok",
  one:"婚恋、亲子、中年处境，说出一类人的心里话。",
  who:"共情能力强、观察细、能长期稳定输出的人",
  red:["编的故事不能当真事写","不贴地域、性别、年龄等群体标签","不教唆、不渲染极端情绪"],
  kw:"婚姻、中年、父母", example:"83年，43岁，钱难挣，新的攀比风已经出现了（10万+）"},
 {id:"ent", ch:"娱", c:"grape", name:"娱乐影视明星", hot:9, level:"适中", lv:"warn",
  one:"影视剧评、综艺、明星动态。",
  who:"追剧多、反应快、能每天跟热点的人",
  red:["不造谣明星私生活","明星照片和剧照有版权和肖像权风险","热点来得快去得快，账号很难沉淀"],
  kw:"明星、电视剧、综艺", example:"41岁薇娅官宣二胎得子，一家四口同框太温馨（10万+）"},
 {id:"sport", ch:"体", c:"sky", name:"体育", hot:2, level:"适中", lv:"ok",
  one:"赛事解读、球队球员、全民健身。",
  who:"懂某项运动、能熬夜看比赛的人",
  red:["赛事画面和图片有版权","不涉及任何赌球、竞猜引流"],
  kw:"足球、篮球、亚运会", example:"11比6碾压日本！名古屋亚运首日被中国队打懵（5.9万）"},
 {id:"politics", ch:"政", c:"coral", name:"时政国际军事", hot:1, level:"不建议新手", lv:"bad",
  one:"国际局势、军事、时事评论。",
  who:"有专业积累、能把握分寸的人",
  red:["个人号没有互联网新闻信息服务许可，不能做时政新闻的原创采编","转载要用国家规定的稿源","违规后果重，可能直接封号"],
  kw:"国际局势、军事", example:"签了！签了！中国和美国真签了！……（7.9万）"},
 {id:"tech", ch:"科", c:"sky", name:"科技数码AI", hot:0, level:"适中", lv:"ok",
  one:"手机数码测评、AI 工具教程、科技新闻解读。",
  who:"爱折腾新工具、能把技术讲成大白话的人",
  red:["测评要真实，收了钱的推广必须标注广告","教程不涉及破解、盗版"],
  kw:"人工智能、手机、AI工具", example:"10-26 的 30 篇热文里没有这个方向，数据积累中"},
 {id:"finance", ch:"财", c:"sun", name:"财经股市", hot:1, level:"难", lv:"bad",
  one:"宏观经济、理财常识、楼市解读。",
  who:"有金融背景、能讲清风险的人",
  red:["不能荐股、不能承诺收益（证券投资咨询要持牌）","不收费带群、不引导站外交易"],
  kw:"股市、基金、房价", example:"李嘉诚曹德旺可能说对了！2026年不买房，5年后会庆幸还是后悔？（5.4万）"},
 {id:"society", ch:"社", c:"grape", name:"社会新闻", hot:3, level:"难", lv:"warn",
  one:"社会事件、法院判决、身边怪事的解读。",
  who:"能核实信息、懂一点法律常识的人",
  red:["不传未经核实的消息","不泄露当事人隐私，未成年人信息绝对不能暴露","判决类引用法院官方通报"],
  kw:"法院判决、热点事件", example:"顺风车司机：几点的飞机？乘客：7点。……（5.7万）"},
 {id:"life", ch:"食", c:"mint", name:"生活旅行美食", hot:5, level:"入门友好", lv:"ok",
  one:"本地美食、旅行攻略、穿搭和居家技巧。",
  who:"爱生活、会拍照、能实地探店的人",
  red:["网上的图片不能随便用，最好自己拍","探店收了钱必须标注广告"],
  kw:"美食、旅行、穿搭", example:"江北的零号路真不错（10万+）"},
 {id:"edu", ch:"教", c:"sun", name:"教育职场", hot:1, level:"适中", lv:"ok",
  one:"升学考试、考公、职场经验。",
  who:"当过老师、HR，或在某行业干得久的人",
  red:["不承诺包过、提分","不贩卖焦虑，政策以教育部门官方为准"],
  kw:"高考、考公、职场", example:"近3000名教育局长，相当一部分没教过一天书（7.5万）"},
 {id:"game", ch:"游", c:"grape", name:"游戏电竞", hot:1, level:"适中", lv:"ok",
  one:"游戏攻略、电竞赛事、新游资讯。",
  who:"资深玩家、看比赛多的人",
  red:["不推广私服、外挂、代练","注意未成年人防沉迷相关规定"],
  kw:"游戏、电竞", example:"刚拿下 S 赛门票就遇难关！iG JiaQi 恐将不能去世界赛……（5.4万）"}
];
const STARS = {"入门友好":"★☆☆","适中":"★★☆","难":"★★★","不建议新手":"慎入"};


// 9 步：通用做法 + 民生方向已经跑通的具体做法
const STEPS = [
 {t:"注册公众号", do:"打开 mp.weixin.qq.com，点「立即注册」，选「订阅号」，主体选「个人」，用身份证和微信扫码完成认证。",
  ok:"能用手机微信扫码登录公众号后台。", tip:"名字想好再注册，个人号一年只能改两次名。名字里最好带上方向，比如「XX算账」。"},
 {t:"定方向和人设", do:"在首页选一个方向，写下三句话：我写给谁看、我能帮他们解决什么、我是什么样的人。",
  ok:"三句话都能说清楚，人设是真实的你，不是编的身份。",
  minsheng:"本号的设定：写给 35~60 岁中年家庭；帮他们把该领的钱领到手；人设是「一个努力生活、爱算账的苦命打工人」。"},
 {t:"找对标账号", do:"打开 weixin.sogou.com，搜你这个方向的关键词，挑 3~5 个更新勤、标题常出现 10万+ 的号关注起来。",
  ok:"手里有 3~5 个对标号，知道它们一周发几篇、写什么。", kw:true},
 {t:"拆爆文标题", do:"把对标号阅读最高的 10 个标题抄下来，拆出骨架：前半句是什么场景或身份，后半句吊了什么悬念。照骨架换成你自己的真实素材。",
  ok:"手里有 10 个骨架，每个都能套一个你自己的选题。", ex:true,
  table:[["场景+新现象","「X，出现了新的 Y」"],["反常对比","「明明 A，却 B」"],["官方确认+金额","「XX 最终确认！最高 N 元」"],["身份恭喜","「恭喜+某类人」"],["亲历+数字","「做了 X，结果数字 Y」（必须是真事）"],["对话体","「A：…… B：……」"],["数字冲击","「一半的人，X 不到 N」"]],
  rule:"复制的是骨架，不是内容；标题里的悬念，正文必须用真实出处兑现。"},
 {t:"写第一篇", do:"写 1200~1800 字。多用「我」、口语和短句，每个数字和政策都写清出处。写完自己读一遍，读着别扭的地方就改。",
  ok:"读着像人说话；每个数字都能说出出处；读者看完能拿走一件有用的事。",
  minsheng:"去 AI 味标准（每千字）：AI 套话 ≤1、「我」≥8、口语词 ≥10、问句 ≥2、数字 ≥10、句长变异系数 ≥0.55。疼文结尾必须给出路。"},
 {t:"做封面和配图", do:"封面做两张：900×383 的大图和 1:1 的方图，关键字放在中间。配图用自己拍的、免费可商用的，或者 AI 生成的。",
  ok:"手机上缩小看，封面的字也能看清；没有用来路不明的图。",
  minsheng:"本号做法：封面背景用 AI 写实图，字用排版工具加上去；正文配 1 张不露人脸的 AI 实景图，其余用数据图。用了 AI 图，发布时勾选「内容由 AI 生成」。"},
 {t:"排版", do:"正文 16px，行距 1.8~2，每段 2~4 行，重点数字加粗加颜色，出处用灰色小字。正文里的外链点不开，网址放到文末「参考资料」。",
  ok:"在手机预览里从头滑到尾，不累眼，重点一眼能看到。",
  link:["看 3 种现成的排版样式（可一键复制）","https://claude.ai/artifact/E2nyFkmNfiiEcV2rUW7cdv"]},
 {t:"发布", do:"在后台「内容管理」新建图文，粘贴正文、上传封面，用「预览」发到自己手机上检查，再点「发表」。",
  ok:"文章在自己手机上显示正常；原创内容勾了「原创」；用了 AI 内容的勾了「内容由 AI 生成」。", tip:"最好固定每天同一时间发，方便以后复盘比较。"},
 {t:"每周复盘", do:"每周一打开后台「数据分析 → 内容分析」，下载上周数据，回答下面三个问题，下周多写表现好、做得动的那一类。",
  ok:"能回答下面三个问题，并定好下周多写哪一类。",
  qs:[["哪类文章更容易被打开？","说明选题和标题是否让读者看懂价值。"],["哪类文章更值得读完、收藏和分享？","说明内容是否真正解决了问题。"],["哪类文章的收入相对稳定，制作成本也能接受？","说明这类文章能不能长期做下去。"]], tip:"流量主的开通条件以后台「流量主」页面显示为准。新号涨粉慢很正常，先把 20 篇写扎实，比追热点重要。"}
];
const N = STEPS.length;


// ===== 每日分工：选定方向后，每天 Claude 做什么、你做什么 =====
// Claude 的每一项由云端任务运行后自动写入记录；没有记录就显示「待运行」或「未搭建」
const CLAUDE_DAILY = [
 {key:"collect_am", t:"07:00 采集公众号热文和搜狗关键词", live:true},
 {key:"collect_pm", t:"19:00 再采集一次", live:true},
 {key:"write", t:"07:30 选题并写好 2 篇（实用文 + 疼文）", live:false},
 {key:"design", t:"做封面、配图和排版预览", live:false}
];
const YOU_DAILY = [
 {key:"review", t:"审 2 篇稿子，确认标题和配图"},
 {key:"publish", t:"复制排版，发布到公众号"},
 {key:"ai", t:"发布时勾选「内容由 AI 生成」"},
 {key:"export", t:"（周一）下载上周数据表格发给 Claude", monday:true}
];

const mascot = `<svg class="mascot" viewBox="0 0 120 120" aria-hidden="true"><g class="bob">
  <path d="M38 40 Q60 26 82 40 L78 46 Q60 38 42 46 Z" fill="var(--coral)" stroke="var(--line)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M30 70 Q30 44 60 44 Q90 44 90 70 Q90 104 60 104 Q30 104 30 70 Z" fill="var(--sun)" stroke="var(--line)" stroke-width="3"/>
  <ellipse class="eye" cx="49" cy="68" rx="4" ry="5.5" fill="#1f2a44"/><ellipse class="eye" cx="71" cy="68" rx="4" ry="5.5" fill="#1f2a44"/>
  <path d="M52 80 Q60 87 68 80" fill="none" stroke="#1f2a44" stroke-width="3" stroke-linecap="round"/>
  <circle cx="42" cy="79" r="4" fill="var(--coral)" opacity=".6"/><circle cx="78" cy="79" r="4" fill="var(--coral)" opacity=".6"/>
  <text x="60" y="99" text-anchor="middle" font-family="ZCOOL KuaiLe,sans-serif" font-size="12" fill="#1f2a44">¥</text></g></svg>`;

// ===== 皮肤：折纸小动物，多边形色块拼成，深浅三色模拟纸的折面 =====
const K = "#1f2a44";
const SKINS = [
 {id:"qian", name:"小钱袋", disc:"#dfeeff", art:null},
 {id:"corgi", name:"折纸柯基", disc:"#fff27a", art:`
  <polygon points="14,49 22,58 25,64" fill="#b9531a"/>
  <polygon points="22,58 62,54 26,76" fill="#f59a52"/><polygon points="62,54 66,74 26,76" fill="#e8742a"/>
  <polygon points="28,74 34,74 33,86 28,86" fill="#b9531a"/><polygon points="40,75 46,75 45,86 41,86" fill="#e8742a"/><polygon points="56,73 63,73 62,86 57,86" fill="#b9531a"/>
  <polygon points="58,56 67,57 62,70" fill="#f7dcb4"/>
  <polygon points="61,42 62,26 68,41" fill="#b9531a"/><polygon points="67,42 73,28 75,45" fill="#e8742a"/>
  <polygon points="60,40 78,46 66,52" fill="#f59a52"/><polygon points="66,52 78,46 72,60" fill="#e8742a"/><polygon points="60,40 66,52 58,56" fill="#b9531a"/>
  <polygon points="74,50 87,54 72,59" fill="#f7dcb4"/>
  <circle class="eye" cx="70" cy="48" r="1.9" fill="${K}"/><circle cx="87" cy="54" r="1.7" fill="${K}"/>`},
 {id:"dragon", name:"折纸小龙", disc:"#e6e9e7", art:`
  <polygon points="28,70 10,62 22,78" fill="#1c6b3c"/><polygon points="10,62 4,52 15,60" fill="#2e9e5b"/>
  <polygon points="28,70 60,62 34,84" fill="#4cc47c"/><polygon points="60,62 66,82 34,84" fill="#2e9e5b"/>
  <polygon points="36,82 42,82 41,92 36,92" fill="#1c6b3c"/><polygon points="56,80 62,80 62,92 57,92" fill="#1c6b3c"/>
  <polygon points="56,64 62,34 70,38 64,66" fill="#2e9e5b"/>
  <polygon points="40,64 30,30 50,48" fill="#4cc47c"/><polygon points="40,64 50,48 58,60" fill="#2e9e5b"/><polygon points="30,30 50,48 46,34" fill="#1c6b3c"/>
  <polygon points="62,34 60,21 66,32" fill="#ffd23f"/><polygon points="67,32 69,19 72,31" fill="#ffd23f"/>
  <polygon points="60,34 82,30 72,42" fill="#4cc47c"/><polygon points="60,34 72,42 62,43" fill="#1c6b3c"/>
  <circle class="eye" cx="70" cy="35" r="1.7" fill="${K}"/>`},
 {id:"elephant", name:"折纸大象", disc:"#ff9fa8", art:`
  <polygon points="20,52 11,64 15,66" fill="#25498a"/>
  <polygon points="20,50 62,46 24,76" fill="#5a8fe0"/><polygon points="62,46 66,76 24,76" fill="#3a6fc4"/>
  <polygon points="24,74 32,74 32,90 24,90" fill="#25498a"/><polygon points="38,75 46,75 46,90 38,90" fill="#3a6fc4"/><polygon points="52,74 60,74 60,90 52,90" fill="#25498a"/>
  <polygon points="60,38 82,44 66,60" fill="#5a8fe0"/><polygon points="82,44 80,62 66,60" fill="#3a6fc4"/>
  <polygon points="57,40 70,44 66,65 53,58" fill="#25498a"/>
  <polygon points="78,56 84,60 86,84 80,84 80,64" fill="#3a6fc4"/><polygon points="80,84 86,84 89,89 80,89" fill="#5a8fe0"/>
  <polygon points="76,60 83,62 74,67" fill="#ffffff"/>
  <circle class="eye" cx="72" cy="48" r="1.9" fill="${K}"/>`},
 {id:"fox", name:"折纸狐狸", disc:"#ffe0e3", art:`
  <polygon points="58,84 84,64 74,88" fill="#ee6a24"/><polygon points="84,64 91,55 80,70" fill="#fff3e6"/>
  <polygon points="34,86 52,50 52,86" fill="#f78f4f"/><polygon points="52,50 68,86 52,86" fill="#ee6a24"/>
  <polygon points="46,62 58,62 52,80" fill="#fff3e6"/>
  <polygon points="36,34 38,18 48,34" fill="#c24d12"/><polygon points="56,34 66,18 68,34" fill="#c24d12"/>
  <polygon points="36,34 68,34 52,56" fill="#ee6a24"/><polygon points="36,34 52,42 52,56" fill="#f78f4f"/>
  <polygon points="44,44 60,44 52,56" fill="#fff3e6"/>
  <circle cx="52" cy="55" r="1.9" fill="${K}"/><circle class="eye" cx="45" cy="40" r="1.8" fill="${K}"/><circle class="eye" cx="59" cy="40" r="1.8" fill="${K}"/>`}
];
const skinArt = (s, cls) => s.art ? `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><g class="bob" style="transform-origin:50px 70px">${s.art}</g></svg>` : (cls==="mascot" ? mascot : mascot.replace('class="mascot"','class=""'));
