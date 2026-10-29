// 工具箱和会员：字数与去 AI 味检测、热点选题、选图片 / 配图、标题工具、数据复盘
// 演示版：开通会员和买点数都不扣钱，只改本机记录。正式上线时接微信支付 / 支付宝。

// ===== 会员与点数 =====
const PLANS = [
  {id:"month", name:"月会员", price:"19.9 元 / 月", days:31},
  {id:"year", name:"年会员", price:"168 元 / 年", days:366, note:"折合每月 14 元"}
];
const PACKS = [
  {id:"p100", points:100, price:"9.9 元"},
  {id:"p500", points:500, price:"39.9 元", note:"多送 25%"}
];
const COST = {article:20, image:10};
const FREE_CHECKS = 3;
const todayCN = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai"}).format(new Date());
const isVip = () => { const v = account().vip; return !!(v && v.until >= todayCN()); };
const points = () => account().points || 0;

const TOOLS = [
  {id:"check", name:"字数和去 AI 味检测", ch:"检", c:"mint", free:true, one:"粘贴文章，逐项看字数、AI 套话、口语、问句和句子长短，标出要改的地方。"},
  {id:"topics", name:"热点选题", ch:"热", c:"coral", one:"按方向看最近哪些话题写的人多、哪些没人写，附最新文章标题找角度。"},
  {id:"titles", name:"标题工具", ch:"题", c:"sun", one:"填上人群、事情和数字，按 6 种爆款公式出候选标题，并自检有没有标题党。"},
  {id:"images", name:"选图片和配图", ch:"图", c:"sky", one:"搜免费可商用的图片，或用点数生成不露脸的 AI 配图。"},
  {id:"review", name:"数据复盘", ch:"盘", c:"grape", one:"上传公众号后台导出的数据表，自动回答每周复盘的三个问题。"}
];

function lockCard(tool){
  return `<section class="sticker lock">
    <h2>这是会员功能</h2>
    <p>「${esc(tool.name)}」需要开通会员才能用。会员可以用工具箱里全部工具，检测次数也不限。</p>
    <button class="btn" data-go="vip">看看会员</button>
  </section>`;
}
function toolHead(t){
  return `<button class="back" data-go="tools">返回工具箱</button>
  <header style="display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center">
    <span class="badge" style="background:var(--${t.c});width:64px;height:64px;font-size:30px" aria-hidden="true">${t.ch}</span>
    <div style="display:grid;gap:4px"><h1 style="font-size:clamp(26px,6vw,36px)">${esc(t.name)}</h1>
    <div class="chips">${t.free?`<span class="chip ok">免费每天 ${FREE_CHECKS} 次，会员不限</span>`:`<span class="chip warn">会员功能</span>`}${isVip()?`<span class="chip ok">你是会员</span>`:""}</div></div>
  </header>
  <p style="color:var(--muted)">${esc(t.one)}</p>`;
}

// ===== 工具箱首页 =====
function toolsHome(){
  return `<header style="display:grid;gap:8px">
    <h1 style="font-size:clamp(28px,6vw,40px)">工具箱</h1>
    <p style="color:var(--muted);max-width:60ch">写公众号每天都要做的几件事：找选题、起标题、写完检查、配图、每周复盘。${isVip()?`你是会员，全部工具都能用。`:`检测免费用，其他工具开通会员后可用。`}</p>
  </header>
  <div class="grid">${TOOLS.map(t=>`
    <button class="dir" data-go="${t.id}">
      <span class="badge" style="background:var(--${t.c})" aria-hidden="true">${t.ch}</span>
      <span class="name">${esc(t.name)}</span>
      <p>${esc(t.one)}</p>
      <span class="chips">${t.free?`<span class="chip ok">免费可用</span>`:isVip()?`<span class="chip ok">已解锁</span>`:`<span class="chip warn">会员</span>`}</span>
    </button>`).join("")}
  </div>
  ${isVip()?"":`<div class="memo">会员 ${PLANS[0].price}，年付 ${PLANS[1].price}。<button class="linkbtn" data-go="vip">看看会员能做什么</button></div>`}`;
}

// ===== 会员页 =====
function vipPage(){
  const a = account(); const v = a.vip;
  return `<button class="back" data-go="tools">返回工具箱</button>
  <header style="display:grid;gap:8px">
    <h1 style="font-size:clamp(28px,6vw,40px)">会员和点数</h1>
    <p style="color:var(--muted);max-width:62ch">会员管工具，点数管 AI。工具箱里的检测、选题、标题、图库和复盘，会员不限次数用；AI 写文章和 AI 配图要花算力，按次扣点数。</p>
  </header>
  <div class="memo"><b>演示价格：</b>下面的价格只是演示，正式上线前会参考同类工具重新定价。演示版点「开通」不扣钱，只在这台设备上记录。</div>
  <section class="sticker" style="gap:6px">
    <h3>我的状态</h3>
    <p>${v && v.until>=todayCN() ? `会员有效期到 <b>${esc(v.until)}</b>` : "还不是会员"}　剩余点数 <b>${points()}</b></p>
    ${Auth.current()?"":`<p style="font-size:13px;color:var(--warn);font-weight:700">还没登录，开通的会员会记在访客模式里。建议先<button class="linkbtn" data-go="login">登录</button>。</p>`}
  </section>
  <section style="display:grid;gap:12px">
    <h2>会员</h2>
    <div class="two">${PLANS.map(p=>`
      <div class="sticker" style="gap:8px">
        <h3>${esc(p.name)}</h3>
        <p style="font-family:var(--display);font-size:30px">${esc(p.price)}</p>
        ${p.note?`<p style="font-size:13px;color:var(--ok);font-weight:700">${esc(p.note)}</p>`:""}
        <ul class="rules"><li>热点选题、标题工具、图库、数据复盘全部可用</li><li>去 AI 味检测不限次数</li><li>更多排版模板（上线后提供）</li></ul>
        <button class="btn" data-buy-plan="${p.id}">开通${esc(p.name)}</button>
      </div>`).join("")}
    </div>
  </section>
  <section style="display:grid;gap:12px">
    <h2>AI 点数</h2>
    <p style="font-size:14px;color:var(--muted)">AI 写一篇文章扣 ${COST.article} 点，生成一张配图扣 ${COST.image} 点。点数不过期，会员和非会员都能买。</p>
    <div class="two">${PACKS.map(p=>`
      <div class="sticker" style="gap:8px">
        <h3>${p.points} 点</h3>
        <p style="font-family:var(--display);font-size:30px">${esc(p.price)}</p>
        ${p.note?`<p style="font-size:13px;color:var(--ok);font-weight:700">${esc(p.note)}</p>`:""}
        <p style="font-size:13px;color:var(--muted)">约等于 ${Math.floor(p.points/COST.article)} 篇文章，或 ${Math.floor(p.points/COST.image)} 张配图</p>
        <button class="btn" data-buy-pack="${p.id}">购买</button>
      </div>`).join("")}
    </div>
  </section>
  ${pending ? `<div class="scrim" data-cancel-buy></div>
  <div class="sticker confirm" role="dialog" aria-modal="true" aria-label="确认开通">
    <h3>确认${esc(pending.label)}</h3>
    <p>${esc(pending.price)}。<b>这是演示版，不会扣钱</b>，确认后只在这台设备上记录。</p>
    <div class="chips" style="gap:10px"><button class="btn" data-confirm-buy>确认（演示）</button><button class="pill" data-cancel-buy>取消</button></div>
  </div>` : ""}`;
}
let pending = null;

// ===== 1. 字数和去 AI 味检测 =====
const AI_PHRASES = ["首先","其次","综上所述","总而言之","值得注意的是","不可否认","在这个时代","让我们","不难发现","众所周知","总的来说","与此同时","不得不说","毋庸置疑","赋能","助力"];
const ORAL = ["咱","啥","呗","嘛","说白了","说实话","其实","挺","真的","这事","咋","得了","算了"];
let checkText = "", checkResult = null;
function runCheck(text){
  const body = text.trim(); const chars = body.replace(/\s/g,"").length || 1; const k = 1000/chars;
  const count = arr => arr.reduce((s,w)=>s+body.split(w).length-1,0);
  const sents = body.split(/[。！？!?\n]+/).map(s=>s.replace(/\s/g,"").length).filter(n=>n>1);
  const mean = sents.reduce((x,y)=>x+y,0)/(sents.length||1);
  const cv = sents.length>1 ? Math.sqrt(sents.reduce((x,y)=>x+(y-mean)**2,0)/sents.length)/mean : 0;
  const paras = body.split(/\n+/).map(p=>p.trim()).filter(Boolean);
  const longParas = paras.filter(p=>p.length>150).length;
  const ai = count(AI_PHRASES), me = body.split("我").length-1, oral = count(ORAL), q = (body.match(/[？?]/g)||[]).length, num = (body.match(/\d+(\.\d+)?/g)||[]).length;
  return {chars, rows:[
    ["字数", chars, chars>=1200&&chars<=1800, "1200~1800", chars<1200?"再补点干货或例子":"删掉重复的话"],
    ["AI 套话（每千字）", +(ai*k).toFixed(1), ai*k<=1, "≤ 1", "把标红的词换成大白话"],
    ["「我」（每千字）", +(me*k).toFixed(1), me*k>=8, "≥ 8", "多写你自己怎么看、怎么算"],
    ["口语词（每千字）", +(oral*k).toFixed(1), oral*k>=10, "≥ 10", "加点「说白了」「其实」这类说话的口气"],
    ["问句（每千字）", +(q*k).toFixed(1), q*k>=2, "≥ 2", "跟读者对话，问一两句"],
    ["数字（每千字）", +(num*k).toFixed(1), num*k>=10, "≥ 10", "用具体数字代替「很多」「不少」"],
    ["句子长短变化", +cv.toFixed(2), cv>=0.55, "≥ 0.55", "长句短句交替着写"],
    ["太长的段落", longParas, longParas===0, "0", "超过 150 字的段落拆成两三段"]
  ]};
}
function highlight(text){
  let h = esc(text);
  AI_PHRASES.forEach(w=>{ h = h.split(esc(w)).join(`<mark class="bad-mark">${esc(w)}</mark>`); });
  ORAL.forEach(w=>{ h = h.split(esc(w)).join(`<mark class="good-mark">${esc(w)}</mark>`); });
  return h;
}
function checkPage(t){
  const a = account(); const used = (a.checks && a.checks.date===todayCN()) ? a.checks.n : 0; const left = isVip() ? "不限" : Math.max(0, FREE_CHECKS-used)+" 次";
  return toolHead(t) + `
  <section class="sticker" style="gap:10px">
    <label for="ck-text" style="font-weight:700">把文章正文粘贴在这里</label>
    <textarea id="ck-text" rows="10" class="field" placeholder="粘贴正文。标题和小标题可以不放。">${esc(checkText)}</textarea>
    <div class="chips" style="gap:10px"><button class="btn" data-run-check>开始检测</button><span style="font-size:13px;color:var(--muted)">今天还能检测：${left}</span></div>
  </section>
  ${checkResult ? `<section class="sticker" style="gap:10px">
    <h2>检测结果</h2>
    <div class="tbl"><table><thead><tr><th>项目</th><th>本文</th><th>标准</th><th>结果</th><th>怎么改</th></tr></thead><tbody>
    ${checkResult.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[3]}</td><td><span class="chip ${r[2]?"ok":"warn"}">${r[2]?"达标":"要改"}</span></td><td>${r[2]?"":esc(r[4])}</td></tr>`).join("")}
    </tbody></table></div>
    <p style="font-size:13px;color:var(--muted)">标准来自 4 篇真实爆文的实测。下面原文里，<mark class="bad-mark">红色</mark>是 AI 套话，<mark class="good-mark">绿色</mark>是口语词。</p>
    <div class="draft">${highlight(checkText)}</div>
  </section>` : ""}`;
}

// ===== 2. 热点选题 =====
let topicsData = null, topicsErr = "", topicsNiche = "";
async function loadTopics(){
  if(topicsData || topicsErr) return;
  try{ const r = await fetch("topics.json", {cache:"no-cache"}); topicsData = await r.json(); }catch(e){ topicsErr = "选题数据没加载出来，刷新一下再试。"; }
  render();
}
function topicsPage(t){
  if(!isVip()) return toolHead(t) + lockCard(t);
  if(!topicsData && !topicsErr){ loadTopics(); return toolHead(t) + `<p>正在加载数据……</p>`; }
  if(topicsErr) return toolHead(t) + `<p class="err">${esc(topicsErr)}</p>`;
  const niches = [...new Set(topicsData.keywords.map(k=>k.niche))];
  const myName = (DIRS.find(x=>x.id===account().direction)||{}).name;
  const cur = topicsNiche || (niches.includes(myName) ? myName : "全部");
  const list = topicsData.keywords.filter(k=>cur==="全部"||k.niche===cur);
  return toolHead(t) + `
  <div class="memo"><b>数据说明：</b>${esc(topicsData.source)}。本次数据时间 ${esc(topicsData.to)}。${esc(topicsData.note)}</div>
  <label style="display:grid;gap:6px;max-width:320px;font-weight:700">看哪个方向<select id="tp-niche" class="field"><option ${cur==="全部"?"selected":""}>全部</option>${niches.map(n=>`<option ${n===cur?"selected":""}>${esc(n)}</option>`).join("")}</select></label>
  <section style="display:grid;gap:12px">${list.map(k=>`
    <div class="sticker" style="gap:8px">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><h3 style="flex:1">${esc(k.kw)}</h3><span class="chip idle">${esc(k.niche)}</span></div>
      <div class="meter" aria-label="3 天内新文 ${k.f3} 篇，共 ${k.total} 篇"><i style="width:${k.total?Math.round(k.f3/k.total*100):0}%"></i></div>
      <p style="font-size:14px">第一页 ${k.total} 篇里，<b>${k.f3} 篇</b>是 3 天内新发的。${k.f3>=8?"很多号在写，话题正热：要写就得找别人没写的角度。":k.f3>=3?"有人在写，热度一般：适合写成实用解读。":"最近几乎没人写：可能是冷门，也可能是机会，先去官方网站看有没有新政策。"}</p>
      ${k.recent.length?`<details><summary style="font-size:14px">看最新 ${k.recent.length} 篇的标题，找角度</summary><ul class="rules" style="margin-top:6px">${k.recent.map(r=>`<li>${esc(r.t)}<span style="color:var(--muted)">（${esc(r.a)}，${esc(r.d)}）</span></li>`).join("")}</ul></details>`:""}
    </div>`).join("")}
  </section>`;
}

// ===== 3. 标题工具 =====
let titleIn = {who:"", what:"", num:"", gain:""}, titleOut = null;
const BAIT = ["震惊","速看","转疯了","紧急通知","必看","99%的人","不看后悔","惊呆","刚刚，"];
function makeTitles(i){
  const who = i.who||"打工人", what = i.what||"这项政策", num = i.num, gain = i.gain||"能多拿一笔钱";
  return [
    ["设问痛点", `${who}，${what}，你真的算清楚了吗？`],
    ["颠覆常识", `都以为${what}跟自己没关系，其实${gain}`],
    ["揭示真相", `${what}背后，很多${who}不知道的一件事`],
    ["时代情绪", `${who}的日子，从${what}开始变了`],
    ["身份恭喜", `恭喜${who}：${gain}`],
    ["官方确认金额", num ? `官方确认！${what}，${who}${num}` : `官方确认！${what}，${who}${gain}`],
    ["数字冲击", num ? `${num}，${what}，一半的${who}还不知道` : `${what}，一半的${who}还不知道`]
  ].map(([f,t])=>{ const len = [...t].length; const bait = BAIT.filter(b=>t.includes(b)); const warn = [];
    if(len<12) warn.push("太短，信息不够"); if(len>32) warn.push("太长，手机上会被截断");
    if(bait.length) warn.push("有标题党词："+bait.join("、"));
    if(!/\d/.test(t)) warn.push("没有数字，可以加一个具体数字");
    return {f, t, len, warn}; });
}
function titlesPage(t){
  if(!isVip()) return toolHead(t) + lockCard(t);
  return toolHead(t) + `
  <section class="sticker" style="gap:12px">
    <div class="form">
      <label>写给谁<input id="tt-who" class="field" value="${esc(titleIn.who)}" placeholder="例：交公积金的打工人"></label>
      <label>什么事<input id="tt-what" class="field" value="${esc(titleIn.what)}" placeholder="例：公积金能交物业费"></label>
      <label>关键数字（可不填）<input id="tt-num" class="field" value="${esc(titleIn.num)}" placeholder="例：每月最高 300 元"></label>
      <label>对读者的好处<input id="tt-gain" class="field" value="${esc(titleIn.gain)}" placeholder="例：每年能省 3600 元"></label>
    </div>
    <button class="btn" data-make-titles>出候选标题</button>
  </section>
  ${titleOut ? `<section class="sticker" style="gap:10px">
    <h2>候选标题</h2>
    <ul class="task">${titleOut.map(x=>`<li><div><span class="chip idle">${esc(x.f)}</span> <b>${esc(x.t)}</b> <span style="font-size:13px;color:var(--muted)">${x.len} 字</span></div>
      <div style="font-size:13px">${x.warn.length?`<span style="color:var(--warn);font-weight:700">${esc(x.warn.join("；"))}</span>`:`<span style="color:var(--ok);font-weight:700">自检通过</span>`}</div></li>`).join("")}</ul>
    <p style="font-size:13px;color:var(--bad);font-weight:700">标题里的每个说法，正文都要用真实出处兑现；「亲历」类标题必须是真事。</p>
  </section>` : ""}`;
}

// ===== 4. 选图片和配图 =====
let imgQ = "", imgList = null, imgErr = "", imgBusy = false, aiPrompt = "", aiMsg = "";
const IMG_HINTS = {"钱":"money","钱包":"wallet","超市":"supermarket","菜市场":"market","公交":"bus stop","城市":"city street","老人":"elderly hands","家庭":"family home","房子":"apartment building","医院":"hospital","学校":"school","办公室":"office desk","手机":"smartphone","计算器":"calculator","账本":"notebook"};
async function searchImages(q){
  const en = IMG_HINTS[q] || q; imgBusy = true; imgErr = ""; imgList = null; render();
  const ctrl = new AbortController(); const timer = setTimeout(()=>ctrl.abort(), 15000);
  try{
    const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(en)}&license=cc0,pdm&page_size=12`, {signal:ctrl.signal});
    if(!r.ok) throw new Error(r.status);
    const d = await r.json(); imgList = d.results || [];
  }catch(e){ imgErr = e.name==="AbortError" ? "图库响应太慢（这个免费图库在国内访问不稳定），稍后再试，或换个关键词。" : "图库暂时连不上，稍后再试。"; }
  clearTimeout(timer); imgBusy = false; render();
}
function imagesPage(t){
  if(!isVip()) return toolHead(t) + lockCard(t);
  return toolHead(t) + `
  <section class="sticker" style="gap:10px">
    <h2>免费可商用图库</h2>
    <p style="font-size:14px;color:var(--muted)">只搜「CC0 公共领域」和「公有领域」的图片，可以免费商用、不用署名。图片来自 Openverse 公开图库，用之前点进出处页再确认一遍许可。</p>
    <div class="row-in"><input id="img-q" class="field" value="${esc(imgQ)}" placeholder="输入关键词，例如：钱包、超市、老人" aria-label="图片关键词"><button class="btn" data-img-search ${imgBusy?"disabled":""}>${imgBusy?"搜索中……":"搜索"}</button></div>
    <div class="chips" style="gap:6px">${Object.keys(IMG_HINTS).map(k=>`<button class="pill small" data-img-hint="${esc(k)}">${esc(k)}</button>`).join("")}</div>
    ${imgErr?`<p class="err">${esc(imgErr)}</p>`:""}
    ${imgList ? (imgList.length ? `<div class="imgs">${imgList.map(i=>`<figure><img src="${esc(i.thumbnail||i.url)}" alt="${esc(i.title||"图库图片")}" loading="lazy"><figcaption>${esc((i.license||"").toUpperCase())}　<a href="${esc(i.foreign_landing_url||i.url)}" target="_blank" rel="noopener">出处</a></figcaption></figure>`).join("")}</div>` : `<p>没搜到，换个词试试。英文关键词结果更多。</p>`) : ""}
  </section>
  <section class="sticker" style="gap:10px">
    <h2>AI 配图</h2>
    <p style="font-size:14px;color:var(--muted)">描述你想要的画面，生成写实配图。规矩：不出现人脸，图里不放能看清的字和数字；用了要在发布时勾选「内容由 AI 生成」。每张扣 ${COST.image} 点，你现在有 ${points()} 点。</p>
    <textarea id="ai-prompt" class="field" rows="3" placeholder="例：傍晚公交站，几个下班的人背影在等车，地面有点湿">${esc(aiPrompt)}</textarea>
    <div class="chips" style="gap:10px"><button class="btn" data-ai-image>生成（扣 ${COST.image} 点）</button><button class="linkbtn" data-go="vip">买点数</button></div>
    ${aiMsg?`<p style="font-size:14px;font-weight:700">${esc(aiMsg)}</p>`:""}
  </section>`;
}

// ===== 5. 数据复盘 =====
let reviewRows = null, reviewErr = "", reviewHours = {};
const SAMPLE = [
  ["恭喜交公积金的打工人：物业费也能提了",3200,0.062,0.58,96,40,18.5],
  ["统计局公布的人均收入，超过一半的人其实没拿到",5100,0.081,0.47,210,85,30.2],
  ["社保交满15年，就能不交了吗？",2800,0.055,0.61,64,52,15.1],
  ["官方确认！油价今晚下调，加满一箱少花7元",4100,0.074,0.39,120,21,22.4],
  ["退休金到账前，这3件事一定要做",2300,0.049,0.66,88,97,12.7],
  ["个税退税开始了，你能退多少？",3600,0.068,0.55,102,73,19.8]
];
function classify(title){
  if(/^恭喜/.test(title)) return "身份恭喜";
  if(/(确认|正式)/.test(title) && /\d/.test(title)) return "官方确认金额";
  if(/\d+\s*(个|种|条|件|招|点)/.test(title)) return "数字清单";
  if(/[？?]$/.test(title)) return "设问痛点";
  if(/(真相|背后|其实没|没人告诉)/.test(title)) return "揭示真相";
  if(/(其实|竟然|没想到|不是)/.test(title)) return "颠覆常识";
  return "其他";
}
function pickCol(headers, keys){ return headers.findIndex(h=>keys.some(k=>String(h).includes(k))); }
function parseTable(rows){
  const headers = rows[0].map(String);
  const col = {title:pickCol(headers,["标题"]), read:pickCol(headers,["阅读次数","阅读人数","阅读"]), open:pickCol(headers,["送达阅读率","打开率"]),
    finish:pickCol(headers,["完成率","完读"]), share:pickCol(headers,["分享"]), fav:pickCol(headers,["收藏","在看"]), income:pickCol(headers,["收入","广告"])};
  if(col.title<0) throw new Error("没找到「标题」这一列");
  const num = v => { const n = parseFloat(String(v??"").replace(/[%,，]/g,"")); return isNaN(n) ? null : (String(v).includes("%") ? n/100 : n); };
  return rows.slice(1).filter(r=>r[col.title]).map(r=>({title:String(r[col.title]), read:num(r[col.read]), open:num(r[col.open]), finish:num(r[col.finish]), share:num(r[col.share]), fav:num(r[col.fav]), income:num(r[col.income])}));
}
function reviewStats(rows){
  const g = {}; rows.forEach(r=>{ const k = classify(r.title); (g[k] = g[k]||[]).push(r); });
  const avg = (arr,f) => { const v = arr.map(f).filter(x=>x!=null); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };
  return Object.entries(g).map(([type,arr])=>{
    const inc = arr.map(r=>r.income).filter(x=>x!=null); const im = inc.length ? inc.reduce((a,b)=>a+b,0)/inc.length : null;
    const cv = inc.length>1 && im ? Math.sqrt(inc.reduce((a,b)=>a+(b-im)**2,0)/inc.length)/im : null;
    return {type, n:arr.length, open:avg(arr,r=>r.open), finish:avg(arr,r=>r.finish), engage:avg(arr,r=>r.read?((r.share||0)+(r.fav||0))/r.read*1000:null), income:im, cv};
  });
}
const pct = v => v==null ? "—" : (v*100).toFixed(1)+"%";
const fx = (v,d=1) => v==null ? "—" : v.toFixed(d);
function best(stats, f){ const s = stats.filter(x=>f(x)!=null).sort((a,b)=>f(b)-f(a)); return s[0]; }
function reviewPage(t){
  if(!isVip()) return toolHead(t) + lockCard(t);
  let out = "";
  if(reviewRows){
    const st = reviewStats(reviewRows);
    const q1 = best(st, x=>x.open), q2 = best(st, x=>x.finish!=null&&x.engage!=null ? x.finish*0.5 + x.engage/100 : x.finish ?? x.engage);
    const q3 = best(st, x=>{ if(x.income==null) return null; const h = parseFloat(reviewHours[x.type]); const per = h>0 ? x.income/h : x.income; return per * (x.cv!=null ? 1/(1+x.cv) : 1); });
    out = `<section class="sticker" style="gap:10px">
      <h2>按标题类型分组（共 ${reviewRows.length} 篇）</h2>
      <div class="tbl"><table><thead><tr><th>类型</th><th>篇数</th><th>打开率</th><th>完读率</th><th>每千次阅读的分享+收藏</th><th>平均收入（元）</th><th>每篇花几小时</th></tr></thead><tbody>
      ${st.map(x=>`<tr><td>${esc(x.type)}</td><td>${x.n}</td><td>${pct(x.open)}</td><td>${pct(x.finish)}</td><td>${fx(x.engage)}</td><td>${fx(x.income)}${x.cv!=null?`<br><span style="font-size:12px;color:var(--muted)">波动 ${fx(x.cv,2)}</span>`:""}</td><td><input class="field hours" data-hours="${esc(x.type)}" value="${esc(reviewHours[x.type]||"")}" inputmode="decimal" aria-label="${esc(x.type)}每篇花几小时" placeholder="小时"></td></tr>`).join("")}
      </tbody></table></div>
      <p style="font-size:13px;color:var(--muted)">标题类型是按标题自动归的类；篇数少于 3 的类型，结论只能参考。</p>
    </section>
    <section class="sticker" style="gap:12px">
      <h2>每周复盘三个问题</h2>
      <div class="qa"><h3>1. 哪类文章更容易被打开？</h3><p class="why">说明选题和标题是否让读者看懂价值。</p>
        <p>${q1?`<b>${esc(q1.type)}</b>，平均打开率 ${pct(q1.open)}。下周多试这类标题。`:"数据表里没有「打开率」或「送达阅读率」这一列。"}</p></div>
      <div class="qa"><h3>2. 哪类文章更值得读完、收藏和分享？</h3><p class="why">说明内容是否真正解决了问题。</p>
        <p>${q2?`<b>${esc(q2.type)}</b>，完读率 ${pct(q2.finish)}，每千次阅读有 ${fx(q2.engage)} 次分享和收藏。这类内容对读者最有用，值得多做。`:"数据表里没有「完成率」「分享」「收藏」这几列。"}</p></div>
      <div class="qa"><h3>3. 哪类文章的收入相对稳定，制作成本也能接受？</h3><p class="why">说明这类文章能不能长期做下去。</p>
        <p>${q3?`<b>${esc(q3.type)}</b>，平均每篇收入 ${fx(q3.income)} 元${q3.cv!=null?`，波动 ${fx(q3.cv,2)}（越小越稳）`:""}${parseFloat(reviewHours[q3.type])>0?`，每小时约 ${fx(q3.income/parseFloat(reviewHours[q3.type]))} 元`:"。在上表填上每篇花几小时，结果会把成本算进去"}。`:"数据表里没有收入这一列。流量主收入在后台「流量主 → 数据统计」里单独导出，可以把收入列加进表里再上传。"}</p></div>
    </section>`;
  }
  return toolHead(t) + `
  <section class="sticker" style="gap:10px">
    <h2>上传数据</h2>
    <p style="font-size:14px;color:var(--muted)">在公众号后台「数据分析 → 内容分析」下载数据表（Excel 或 CSV），直接上传。文件只在你的浏览器里读，不会上传到任何服务器。</p>
    <input type="file" id="rv-file" accept=".xlsx,.xls,.csv" aria-label="选择数据表">
    <div class="chips" style="gap:10px"><button class="pill" data-rv-sample>先用示例数据看看</button></div>
    ${reviewErr?`<p class="err">${esc(reviewErr)}</p>`:""}
    ${reviewRows && reviewRows.sample ? `<p class="pending">现在显示的是示例数据，不是你的真实数据。</p>` : ""}
  </section>` + out;
}
async function readReviewFile(file){
  reviewErr = "";
  try{
    if(!window.XLSX){ await new Promise((ok,bad)=>{ const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array"});
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw:false});
    const hi = rows.findIndex(r=>r.some(c=>String(c).includes("标题")));
    if(hi<0) throw new Error("没找到「标题」这一列");
    reviewRows = parseTable(rows.slice(hi));
    if(!reviewRows.length) throw new Error("表里没有文章数据");
  }catch(e){ reviewRows = null; reviewErr = "读不出这个文件：" + (e.message||"格式不对") + "。请上传公众号后台导出的原始表格。"; }
  render();
}

// ===== 路由和事件 =====
const TOOL_PAGES = {tools:toolsHome, vip:vipPage, check:()=>checkPage(TOOLS[0]), topics:()=>topicsPage(TOOLS[1]), titles:()=>titlesPage(TOOLS[2]), images:()=>imagesPage(TOOLS[3]), review:()=>reviewPage(TOOLS[4])};

app.addEventListener("click", e=>{
  const plan = e.target.closest("[data-buy-plan]"); if(plan){ const p = PLANS.find(x=>x.id===plan.dataset.buyPlan); pending = {kind:"plan", id:p.id, label:"开通"+p.name, price:p.price, days:p.days}; render(); return; }
  const pack = e.target.closest("[data-buy-pack]"); if(pack){ const p = PACKS.find(x=>x.id===pack.dataset.buyPack); pending = {kind:"pack", id:p.id, label:"购买 "+p.points+" 点", price:p.price, points:p.points}; render(); return; }
  if(e.target.closest("[data-cancel-buy]")){ pending = null; render(); return; }
  if(e.target.closest("[data-confirm-buy]")){
    const p = pending; pending = null;
    patch(a=>{ if(p.kind==="plan"){ const from = a.vip && a.vip.until>=todayCN() ? new Date(a.vip.until+"T12:00:00+08:00") : new Date(); from.setDate(from.getDate()+p.days); a.vip = {plan:p.id, until:new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai"}).format(from)}; }
      else a.points = (a.points||0) + p.points; });
    toast(p.kind==="plan" ? "会员已开通（演示）" : `已到账 ${p.points} 点（演示）`); confetti(innerWidth/2, 220, 40); render(); return;
  }
  if(e.target.closest("[data-run-check]")){
    checkText = document.getElementById("ck-text").value;
    if(checkText.replace(/\s/g,"").length < 50){ toast("至少粘贴 50 个字再检测"); return; }
    if(!isVip()){ const a = account(); const used = a.checks && a.checks.date===todayCN() ? a.checks.n : 0;
      if(used >= FREE_CHECKS){ toast("今天的免费次数用完了，开通会员不限次数"); return; }
      patch(x=>{ x.checks = {date:todayCN(), n:used+1}; }); }
    checkResult = runCheck(checkText); render(); return;
  }
  if(e.target.closest("[data-make-titles]")){
    titleIn = {who:document.getElementById("tt-who").value.trim(), what:document.getElementById("tt-what").value.trim(), num:document.getElementById("tt-num").value.trim(), gain:document.getElementById("tt-gain").value.trim()};
    if(!titleIn.what){ toast("至少写上「什么事」"); return; }
    titleOut = makeTitles(titleIn); render(); return;
  }
  const hint = e.target.closest("[data-img-hint]"); if(hint){ imgQ = hint.dataset.imgHint; searchImages(imgQ); return; }
  if(e.target.closest("[data-img-search]")){ imgQ = document.getElementById("img-q").value.trim(); if(imgQ) searchImages(imgQ); return; }
  if(e.target.closest("[data-ai-image]")){
    aiPrompt = document.getElementById("ai-prompt").value.trim();
    if(!aiPrompt){ toast("先描述一下想要的画面"); return; }
    if(points() < COST.image){ aiMsg = `点数不够：需要 ${COST.image} 点，你有 ${points()} 点。`; render(); return; }
    patch(a=>{ a.points = (a.points||0) - COST.image; });
    aiMsg = `已扣 ${COST.image} 点（演示）。演示版还没接云端出图服务，正式上线后这里会显示生成的图片。`; render(); return;
  }
  if(e.target.closest("[data-rv-sample]")){ reviewRows = SAMPLE.map(r=>({title:r[0], read:r[1], open:r[2], finish:r[3], share:r[4], fav:r[5], income:r[6]})); reviewRows.sample = true; reviewErr = ""; render(); return; }
});
app.addEventListener("change", e=>{
  if(e.target.id==="tp-niche"){ topicsNiche = e.target.value; render(); return; }
  if(e.target.id==="rv-file" && e.target.files[0]){ readReviewFile(e.target.files[0]); return; }
  const h = e.target.closest("[data-hours]"); if(h){ reviewHours[h.dataset.hours] = h.value; render(); return; }
});
app.addEventListener("keydown", e=>{ if(e.key==="Enter" && e.target.id==="img-q"){ imgQ = e.target.value.trim(); if(imgQ) searchImages(imgQ); } });
