// 创作向导「写一篇」：每一项都可以自己选，右边预览随选随变；也可以一键自动跑完。
// 会员项照样展示、可以预览，选中时提示「开通会员后可以应用」，不会真的应用。

const CR = {
  types: {
    minsheng: [["实用文","读完能直接去办、去领、去避坑"],["疼文","用真实统计说出普通人的处境，结尾给出路"]],
    other: [["干货文","把一件事讲清楚、讲到能照着做"],["观点文","对一件事给出自己的看法和理由"]]
  },
  words: [[800,"短文，适合快讯和提醒"],[1200,"标准长度，最常用"],[1500,"讲透一件事"],[1800,"深度解读，适合数据多的疼文"]],
  images: [
    {id:"data", name:"数据图卡", vip:false, one:"把关键数字做成图，最可信"},
    {id:"text", name:"文字金句卡", vip:false, one:"一句话做成卡片，适合转发"},
    {id:"line", name:"简笔插画", vip:false, one:"线条小插画，轻松不抢戏"},
    {id:"photo", name:"AI 写实照片", vip:true, one:"不露脸的生活场景照片，氛围最强（每张扣 10 点）"}
  ],
  imgCounts: [1,2,3,4],
  layouts: [
    {id:"a", name:"简洁报纸", vip:false, num:"#a3261e", head:"border-bottom:2px solid currentColor;padding-bottom:4px"},
    {id:"b", name:"暖色生活", vip:true, num:"#c4561a", head:"background:#f7ecdf;color:#8a4a17;padding:4px 10px;border-radius:4px"},
    {id:"c", name:"数据卡片", vip:true, num:"#0f6e60", head:"color:#0f6e60"}
  ]
};
const OUTLINE = {
  "实用文": ["先说结论：这件事和你有什么关系","哪些人能办、能领","具体怎么办，一步一步","容易踩的坑","官方出处"],
  "疼文": ["一个扎心的真实数字","这个数字背后是怎么回事","普通人真实的处境","能做的三件事"],
  "干货文": ["先说结论","为什么","具体怎么做","常见误区"],
  "观点文": ["我的看法","事实和数据","反方怎么说","我的建议"]
};

let crNote = "";   // 会员提示
function crDraft(){ const a = account(); return a.draft || {}; }
function crSave(p){ patch(a=>{ a.draft = Object.assign({}, a.draft||{}, p); }); }
function crDefaults(){
  const a = account(); const dir = a.direction || "minsheng";
  const types = CR.types[dir==="minsheng"?"minsheng":"other"];
  return {dir, type:types[0][0], words:1200, imgStyle:"data", imgCount:2, layout:"a", topic:"", title:""};
}
function crState(){ return Object.assign(crDefaults(), crDraft()); }

function opt(group, value, label, sub, on, vip){
  return `<button class="opt${on?" on":""}" data-cr="${group}" data-val="${esc(value)}" aria-pressed="${on}">
    <span class="opt-name">${esc(label)}${vip?` <span class="chip warn">会员</span>`:""}</span>${sub?`<span class="opt-sub">${esc(sub)}</span>`:""}</button>`;
}

// 配图风格的示意小图（纯 SVG，说明风格长什么样，不是成品）
function imgSample(id){
  if(id==="data") return `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#eef3f0"/><text x="12" y="22" font-size="10" fill="#123B2F">人均可支配收入</text><rect x="12" y="34" width="104" height="12" fill="#123B2F"/><rect x="12" y="54" width="86" height="12" fill="#8fb5a4"/><text x="120" y="44" font-size="9" fill="#123B2F">34230</text><text x="102" y="64" font-size="9" fill="#123B2F">28388</text></svg>`;
  if(id==="text") return `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#123B2F"/><text x="80" y="42" font-size="12" fill="#fff" text-anchor="middle" font-family="Noto Serif SC,serif">平均数会被拽高，</text><text x="80" y="60" font-size="12" fill="#fff" text-anchor="middle" font-family="Noto Serif SC,serif">账本不会骗你。</text></svg>`;
  if(id==="line") return `<svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="#fbfaf7"/><g fill="none" stroke="#123B2F" stroke-width="2" stroke-linecap="round"><path d="M20 72 H140"/><rect x="38" y="36" width="34" height="36"/><path d="M34 38 L55 22 L76 38"/><circle cx="108" cy="46" r="10"/><path d="M108 56 V72 M98 62 H118"/></g></svg>`;
  return `<svg viewBox="0 0 160 90" aria-hidden="true"><defs><linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb3c0"/><stop offset="1" stop-color="#4b5a63"/></linearGradient></defs><rect width="160" height="90" fill="url(#ph)"/><rect x="0" y="62" width="160" height="28" fill="#39444a"/><g fill="#1e2428"><rect x="40" y="34" width="12" height="30" rx="5"/><rect x="62" y="30" width="13" height="34" rx="5"/><rect x="88" y="36" width="12" height="28" rx="5"/></g><rect x="112" y="20" width="4" height="44" fill="#2a3237"/><text x="8" y="14" font-size="8" fill="#fff">示意：背影、不露脸</text></svg>`;
}

function createPage(){
  const s = crState(); const vip = isVip(); const dir = DIRS.find(x=>x.id===s.dir) || DIRS[0];
  const types = CR.types[s.dir==="minsheng"?"minsheng":"other"];
  const hot = (topicsData && topicsData.keywords || []).filter(k=>k.niche===dir.name).slice(0,6);
  if(!topicsData && !topicsErr) loadTopics();
  return `
  <button class="back" data-go="">返回首页</button>
  <header style="display:grid;gap:10px">
    <h1 style="font-size:clamp(28px,5vw,40px)">写一篇</h1>
    <p style="color:var(--muted);max-width:40em">每一项都可以自己选，手机预览马上跟着变。不想选，就点「一键自动」，按推荐方案一次跑完，结果照样能改。</p>
    <div class="chips" style="gap:12px"><button class="btn" data-cr-auto>一键自动</button><button class="pill" data-cr-reset>全部重选</button><span style="font-size:13px;color:var(--muted)">方向：${esc(dir.name)}（在设置里可以换）</span></div>
  </header>
  ${crNote ? `<div class="memo" role="status">${crNote} <button class="linkbtn" data-go="vip">去开通会员</button></div>` : ""}
  <div class="create">
    <div class="create-steps">
      <section class="cstep"><h2><span class="num">1</span>选题</h2>
        <label style="display:grid;gap:6px;font-size:14px">自己写一个选题<input id="cr-topic" class="field" value="${esc(s.topic)}" placeholder="例：公积金能交物业费了"></label>
        <p style="font-size:14px;color:var(--muted)">或者从最近的热点里挑（会员）：</p>
        <div class="opts">${hot.length ? hot.map(k=>opt("hot", k.kw, k.kw, `第一页 ${k.total} 篇里 ${k.f3} 篇是 3 天内新发的`, s.topic===k.kw, !vip)).join("") : `<p style="font-size:14px;color:var(--muted)">${topicsErr?"热点数据没加载出来":"正在加载热点数据……"}</p>`}</div>
      </section>
      <section class="cstep"><h2><span class="num">2</span>文章类型</h2>
        <div class="opts">${types.map(t=>opt("type", t[0], t[0], t[1], s.type===t[0], false)).join("")}</div>
      </section>
      <section class="cstep"><h2><span class="num">3</span>字数</h2>
        <div class="opts">${CR.words.map(w=>opt("words", w[0], w[0]+" 字", w[1], s.words===w[0], false)).join("")}</div>
      </section>
      <section class="cstep"><h2><span class="num">4</span>标题</h2>
        <label style="display:grid;gap:6px;font-size:14px">自己写标题，边写边检查<input id="cr-title" class="field" value="${esc(s.title)}" placeholder="写好后按回车或点别处"></label>
        ${s.topic ? `<p style="font-size:14px;color:var(--muted)">或者用爆款公式出的候选（会员）：</p><div class="opts">${makeTitles({who:dir.id==="minsheng"?"打工人":"读者", what:s.topic, num:"", gain:"能少走弯路"}).slice(0,4).map(x=>opt("title", x.t, x.t, x.f, s.title===x.t, !vip)).join("")}</div>` : ""}
      </section>
      <section class="cstep"><h2><span class="num">5</span>配图风格</h2>
        <div class="opts imgopts">${CR.images.map(i=>`<button class="opt${s.imgStyle===i.id?" on":""}" data-cr="imgStyle" data-val="${i.id}" aria-pressed="${s.imgStyle===i.id}">${imgSample(i.id)}<span class="opt-name">${esc(i.name)}${i.vip?` <span class="chip warn">会员</span>`:""}</span><span class="opt-sub">${esc(i.one)}</span></button>`).join("")}</div>
        <p style="font-size:14px;color:var(--muted)">配几张图：</p>
        <div class="opts">${CR.imgCounts.map(n=>opt("imgCount", n, n+" 张", "", s.imgCount===n, false)).join("")}</div>
      </section>
      <section class="cstep"><h2><span class="num">6</span>排版</h2>
        <div class="opts">${CR.layouts.map(l=>opt("layout", l.id, l.name, "", s.layout===l.id, l.vip && !vip)).join("")}</div>
      </section>
      <section class="cstep"><h2><span class="num">7</span>出稿</h2>
        ${!WRITER_URL ? `<p style="font-size:14px;color:var(--muted)">点「AI 写全文」会在新窗口打开 Claude 版，带上你上面的全部选择，打开就自动开始写（需要能打开 claude.ai，第一次要点「允许」）。具体数字和政策会标成【待补】并告诉你去哪个官网查；想让数字直接写进去，在那边贴上官方原文再写一次。</p>`
        : `<p style="font-size:14px;color:var(--muted)">AI 会先去政府网站和官方媒体查原文、查最新数据，再按你上面的选择写全文。每个数字都附出处链接，查不到的标【待补】，不会编。写一篇大约 1~3 分钟。</p>`}
        ${!WRITER_URL ? "" : account().writerPass ?`<p style="font-size:13px;color:var(--muted)">写作口令已保存在这台设备上。<button class="linkbtn" data-cr-forget>清除口令</button></p>`
          : `<label style="display:grid;gap:6px;font-size:14px">写作口令（演示期 AI 写作只对站长开放）<input id="cr-pass" class="field" type="password" autocomplete="off" placeholder="输入口令后才能写全文"></label>`}
        <div class="chips" style="gap:12px"><button class="btn" data-cr-full ${crGen.busy?"disabled":""}>${crGen.busy?"正在写……":"AI 写全文"}</button><button class="pill" data-cr-brief>只出写作提纲（免费）</button></div>
      </section>
    </div>
    ${previewHTML()}
  </div>
  ${genHTML()}
  ${crBrief ? `<section class="sticker" style="gap:10px"><h2>写作提纲</h2><div class="draft" id="cr-brief">${esc(crBrief)}</div>
    <div class="chips" style="gap:10px"><button class="pill" data-cr-copy>复制提纲</button><a class="pill" href="https://claude.ai/artifact/Mg7dzg3ZoovB4BX3aEYPbM#${esc(s.dir)}" target="_blank" rel="noopener">带着提纲去 Claude 版写全文（新窗口打开）</a></div></section>` : ""}`;
}
let crBrief = "";
// AI 写全文：经 Cloudflare 上的中转调用 Claude，密钥不在网页里
const WRITER_URL = "";   // 中转部署好以后填上；空着就跳到 Claude 版写
const CLAUDE_GUIDE = "https://claude.ai/artifact/Mg7dzg3ZoovB4BX3aEYPbM";
let crGen = {busy:false, text:"", status:"", src:[], err:"", stop:""};
const genBody = t => (t.split("【正文】")[1] || t).split("【出处】")[0].replace(/^## .*$/gm,"").replace(/【配图[^】]*】/g,"");
function genHTML(){
  const g = crGen;
  if(!g.busy && !g.text && !g.err) return "";
  const done = !g.busy && g.text;
  const ck = done ? runCheck(genBody(g.text)) : null;
  if(ck){ const w = crState().words; ck.rows[0] = ["字数", ck.chars, Math.abs(ck.chars-w) <= w*0.2, `${w*0.8}~${w*1.2}`]; }  // 按你选的字数，上下 20% 都算达标
  return `<section class="sticker" style="gap:12px" id="cr-gen">
    <h2>${g.busy ? "AI 正在写" : g.err && !g.text ? "没写成" : "写好了"}</h2>
    <p class="pv-meta" id="cr-status" aria-live="polite">${esc(g.busy ? (g.status || "正在连接……") : g.stop==="max_tokens" ? "文章太长被截断了，可以把字数调小再写一次。" : "")}</p>
    ${g.err ? `<p class="err">${esc(g.err)}</p>` : ""}
    <div class="draft" id="cr-out"${g.text?"":" hidden"}>${esc(g.text)}</div>
    ${ck ? `<h3>去 AI 味检测</h3><div class="tbl"><table><thead><tr><th>项目</th><th>本文</th><th>标准</th><th>结果</th></tr></thead><tbody>
      ${ck.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[3]}</td><td><span class="chip ${r[2]?"ok":"warn"}">${r[2]?"达标":"要改"}</span></td></tr>`).join("")}</tbody></table></div>` : ""}
    ${done && g.src.length ? `<details><summary>这次查过的网页（${g.src.length} 个）</summary><ul style="font-size:13px;display:grid;gap:4px;margin-top:8px">${g.src.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("")}</ul></details>` : ""}
    ${done ? `<p style="font-size:13px;color:var(--muted)">发布前请点开出处，自己核对每个数字；标了【待补】的地方补上真实数据。发布时勾选「内容由 AI 生成」。</p>
    <div class="chips" style="gap:10px"><button class="pill" data-cr-copyart>复制全文</button><button class="pill" data-cr-full>换一版重写</button></div>` : ""}
  </section>`;
}
async function crWrite(){
  const s = crState(); const pass = account().writerPass;
  if(!s.topic){ toast("先写一个选题"); return; }
  if(!WRITER_URL){ // API 还没接：带着选项跳到 Claude 版，打开就自动开始写
    const img = CR.images.find(i=>i.id===s.imgStyle);
    const q = new URLSearchParams({auto:1, type:s.type, topic:s.topic, title:s.title||"", words:s.words, img:img?img.name:"", n:s.imgCount});
    window.open(`${CLAUDE_GUIDE}#${s.dir}?${q}`, "_blank", "noopener"); render(); return;
  }
  if(!pass){ toast("先填写作口令"); document.getElementById("cr-pass")?.focus(); return; }
  crGen = {busy:true, text:"", status:"", src:[], err:"", stop:""}; render();
  document.getElementById("cr-gen")?.scrollIntoView({block:"start", behavior:"smooth"});
  const out = () => document.getElementById("cr-out"), st = () => document.getElementById("cr-status");
  try{
    const r = await fetch(WRITER_URL, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({passcode:pass, dir:s.dir, type:s.type, words:s.words, topic:s.topic, title:s.title, imgStyle:s.imgStyle, imgCount:s.imgCount})});
    if(r.status===401){ patch(a=>{ delete a.writerPass; }); throw new Error("口令不对，请重新输入。"); }
    if(!r.ok && !r.body) throw new Error("服务出错（"+r.status+"）");
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
    for(;;){
      const {value, done} = await rd.read(); if(done) break;
      buf += dec.decode(value, {stream:true}); let i;
      while((i = buf.indexOf("\n")) >= 0){
        const line = buf.slice(0, i); buf = buf.slice(i+1); if(!line.trim()) continue;
        let m; try{ m = JSON.parse(line); }catch(e){ if(!r.ok) throw new Error(line.slice(0,200)); continue; }
        if(m.t){ crGen.text += m.t; crGen.status = "正在写正文……"; const o = out(); if(o){ o.hidden = false; o.textContent = crGen.text; o.scrollTop = o.scrollHeight; } }
        if(m.s){ crGen.status = m.s; }
        if(m.src) crGen.src = m.src;
        if(m.done) crGen.stop = m.stop;
        if(m.err) crGen.err = m.err;
        const e = st(); if(e) e.textContent = crGen.status;
      }
    }
    if(!crGen.text && !crGen.err) crGen.err = "没有收到文章，请再试一次。";
  }catch(err){
    crGen.err = err.message==="Failed to fetch" ? "连不上 AI 写作服务。如果你在国内，可能是 Cloudflare 的默认网址被拦了。" : err.message;
  }
  crGen.busy = false; render();
}
let crTry = null;     // 非会员点了会员项：只在预览里试看，不存进草稿
let crChanged = "";    // 刚改的是哪一项，预览里对应的位置闪一下

// 预览：做成一部手机，上面是订阅号消息列表里的样子，下面是文章正文
function previewHTML(){
  const s = Object.assign(crState(), crTry || {});
  const layout = CR.layouts.find(l=>l.id===s.layout) || CR.layouts[0];
  const img = CR.images.find(i=>i.id===s.imgStyle) || CR.images[0];
  const outline = OUTLINE[s.type] || OUTLINE["干货文"];
  const mins = Math.max(2, Math.round(s.words/400));
  const per = Math.round(s.words/outline.length/10)*10;
  const topic = s.topic || "公积金能交物业费了";
  const title = s.title || `${topic}，你真的算清楚了吗？`;
  const titleWarn = s.title ? makeTitleCheck(s.title) : [];
  const hl = k => crChanged===k ? " pv-hit" : "";
  // 第 k 张图放在第几节后面
  const imgAt = {}; for(let k=0;k<s.imgCount;k++) imgAt[Math.floor(k*outline.length/s.imgCount)] = (imgAt[Math.floor(k*outline.length/s.imgCount)]||0)+1;
  const lines = Math.max(2, Math.min(8, Math.round(per/80)));
  const bars = n => Array.from({length:n},(_,i)=>`<i style="width:${i===n-1?55:88+((i*37)%12)}%"></i>`).join("");
  let n = 0;
  const body = outline.map((h,i)=>`
      <h4 class="art-h${hl("type")}">${esc(h)}</h4>
      ${i===0 ? `<p class="art-p">${esc(topic)}。今年前三季度，全国居民人均可支配收入 <b class="art-num">34230 元</b>，我第一眼看到，愣了一下。</p>` : ""}
      <div class="art-lines${hl("words")}">${bars(i===0?lines-1:lines)}</div>
      ${Array.from({length:imgAt[i]||0},()=>`<figure class="art-img${hl("imgStyle")}${hl("imgCount")}">${imgSample(s.imgStyle)}<figcaption>第 ${++n} 张图</figcaption></figure>`).join("")}`).join("");
  return `<aside class="preview" aria-label="预览" aria-live="polite">
      <p class="pv-label">预览：读者在手机上看到的样子${s.topic?"":"（还没写选题，先用示例）"}</p>
      ${crTry ? `<p class="pv-try">正在试看会员效果，开通会员后可以应用</p>` : ""}
      <div class="phone">
        <div class="feed${hl("title")}${hl("topic")}${hl("imgStyle")}">
          <div class="feed-cover">${imgSample(s.imgStyle)}</div>
          <p class="feed-title">${esc(title)}</p>
        </div>
        ${titleWarn.length?`<p class="pv-warn">${esc(titleWarn.join("；"))}</p>`:(s.title?`<p class="pv-ok">标题自检通过</p>`:"")}
        <article class="art lay-${layout.id}${hl("layout")}">
          <h3 class="art-title">${esc(title)}</h3>
          <p class="art-meta${hl("words")}${hl("type")}">${esc(s.type)}，约 ${s.words} 字，读完约 ${mins} 分钟</p>
          ${body}
        </article>
      </div>
      <p class="pv-meta">共 ${outline.length} 节，每节约 ${per} 字；配 ${s.imgCount} 张${esc(img.name)}；${esc(layout.name)}排版</p>
    </aside>`;
}
function refreshPreview(){ const el = app.querySelector(".preview"); if(el) el.outerHTML = previewHTML(); }

function makeTitleCheck(t){
  const len = [...t].length; const w = [];
  if(len<12) w.push("太短，信息不够"); if(len>32) w.push("太长，手机上会被截断");
  const bait = BAIT.filter(b=>t.includes(b)); if(bait.length) w.push("有标题党词："+bait.join("、"));
  if(!/\d/.test(t)) w.push("可以加一个具体数字");
  return w;
}
function buildBrief(s){
  const outline = OUTLINE[s.type] || OUTLINE["干货文"]; const per = Math.round(s.words/outline.length/10)*10;
  const img = CR.images.find(i=>i.id===s.imgStyle); const lay = CR.layouts.find(l=>l.id===s.layout);
  return [`标题：${s.title || "（待定）"}`, `选题：${s.topic || "（待定）"}`, `类型：${s.type}，约 ${s.words} 字`, `配图：${s.imgCount} 张${img.name}`, `排版：${lay.name}`, "", "提纲：",
    ...outline.map((h,i)=>`${i+1}. ${h}（约 ${per} 字）`), "", "写作规矩：每个数字和政策都写出处；不编造个人经历；多用「我」和口语，长短句交替；标题里的悬念正文要兑现。"].join("\n");
}
// 会员项：会员直接应用；非会员只在预览里试看，并提示开通后可以应用
function crPick(isVipOpt, p){
  if(isVipOpt && !isVip()){ crTry = p; crNote = "这一项是会员功能，预览里先给你试看效果；开通会员后可以应用。"; return; }
  crTry = null; crNote = ""; crSave(p);
}

app.addEventListener("click", e=>{
  const o = e.target.closest("[data-cr]");
  if(o){
    const g = o.dataset.cr, v = o.dataset.val;
    crChanged = g==="hot" ? "topic" : g;
    if(g==="hot") crPick(true, {topic:v, title:""});
    else if(g==="title") crPick(true, {title:v});
    else if(g==="imgStyle") crPick(CR.images.find(i=>i.id===v).vip, {imgStyle:v});
    else if(g==="layout") crPick(CR.layouts.find(x=>x.id===v).vip, {layout:v});
    else crPick(false, {[g]: (g==="words"||g==="imgCount") ? +v : v});
    render(); return;
  }
  if(e.target.closest("[data-cr-auto]")){
    const d = crDefaults(); const dir = DIRS.find(x=>x.id===d.dir);
    const hot = (topicsData && topicsData.keywords || []).filter(k=>k.niche===dir.name);
    const topic = isVip() && hot[0] ? hot[0].kw : (crState().topic || (d.dir==="minsheng" ? "公积金能交物业费了" : dir.kw.split("、")[0]));
    const title = isVip() ? makeTitles({who:d.dir==="minsheng"?"打工人":"读者", what:topic, num:"", gain:"能少走弯路"})[0].t : crState().title;
    crSave(Object.assign(d, {topic, title, imgStyle:isVip()?"photo":"data", layout:"a"})); crTry = null; crChanged = "";
    crNote = isVip() ? "" : "已按免费方案选好。开通会员后，自动选题会用最新热点，标题用爆款公式，还能配 AI 写实照片。";
    if(!WRITER_URL || account().writerPass){ crBrief = ""; crWrite(); return; }
    crBrief = buildBrief(crState());
    render(); document.getElementById("cr-brief")?.scrollIntoView({block:"center"}); return;
  }
  if(e.target.closest("[data-cr-forget]")){ patch(a=>{ delete a.writerPass; }); render(); return; }
  if(e.target.closest("[data-cr-copyart]")){ navigator.clipboard.writeText(crGen.text).then(()=>toast("全文已复制")).catch(()=>toast("复制失败，请手动选中复制")); return; }
  if(e.target.closest("[data-cr-reset]")){ patch(a=>{ a.draft = {}; }); crBrief = ""; crNote = ""; crTry = null; crChanged = ""; render(); return; }
  if(e.target.closest("[data-cr-brief]")){ const s = crState(); if(!s.topic){ toast("先写一个选题"); return; } crBrief = buildBrief(s); render(); document.getElementById("cr-brief")?.scrollIntoView({block:"center"}); return; }
  if(e.target.closest("[data-cr-full]")){ if(!crGen.busy) crWrite(); return; }
  if(e.target.closest("[data-cr-copy]")){ const el = document.getElementById("cr-brief"); navigator.clipboard.writeText(el.textContent).then(()=>toast("提纲已复制")).catch(()=>{ const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("已选中，按 Ctrl+C 复制"); }); return; }
});
// 打字时只刷新预览（整页重画会让输入框失去焦点）；离开输入框再整页刷新，出标题候选
app.addEventListener("input", e=>{
  if(e.target.id==="cr-topic"){ crTry = null; crChanged = "topic"; crSave({topic:e.target.value.trim(), title:""}); refreshPreview(); }
  if(e.target.id==="cr-title"){ crTry = null; crChanged = "title"; crSave({title:e.target.value.trim()}); refreshPreview(); }
});
app.addEventListener("change", e=>{
  if(e.target.id==="cr-topic" || e.target.id==="cr-title"){ crNote = ""; render(); }
  if(e.target.id==="cr-pass" && e.target.value.trim()){ patch(a=>{ a.writerPass = e.target.value.trim(); }); render(); }
});
TOOL_PAGES.create = createPage;
