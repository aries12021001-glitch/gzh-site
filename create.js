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
  const layout = CR.layouts.find(l=>l.id===s.layout) || CR.layouts[0];
  const img = CR.images.find(i=>i.id===s.imgStyle) || CR.images[0];
  const outline = OUTLINE[s.type] || OUTLINE["干货文"];
  const mins = Math.max(2, Math.round(s.words/400));
  const per = Math.round(s.words/outline.length/10)*10;
  const hot = (topicsData && topicsData.keywords || []).filter(k=>k.niche===dir.name).slice(0,6);
  if(!topicsData && !topicsErr) loadTopics();
  const titleShown = s.title || (s.topic ? `${s.topic}，你真的算清楚了吗？` : "（选好选题后，这里出现标题）");
  const titleWarn = s.title ? makeTitleCheck(s.title) : [];
  return `
  <button class="back" data-go="">返回首页</button>
  <header style="display:grid;gap:10px">
    <h1 style="font-size:clamp(28px,5vw,40px)">写一篇</h1>
    <p style="color:var(--muted);max-width:40em">每一项都可以自己选，右边的预览马上跟着变。不想选，就点「一键自动」，按推荐方案一次跑完，结果照样能改。</p>
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
        <p style="font-size:14px;color:var(--muted)">先出写作提纲（免费）；AI 按提纲写全文要扣 20 点，写出来只用你给的资料，缺的地方标【待补】。</p>
        <div class="chips" style="gap:12px"><button class="btn" data-cr-brief>出写作提纲</button><button class="pill" data-cr-full>AI 写全文（20 点）</button></div>
      </section>
    </div>
    <aside class="preview" aria-label="预览">
      <p class="pv-label">预览</p>
      <div class="pv-cover">${imgSample(s.imgStyle)}</div>
      <h3 class="pv-title">${esc(titleShown)}</h3>
      ${titleWarn.length?`<p class="pv-warn">${esc(titleWarn.join("；"))}</p>`:(s.title?`<p class="pv-ok">标题自检通过</p>`:"")}
      <p class="pv-meta">${esc(s.type)}，约 ${s.words} 字，读完约 ${mins} 分钟，配 ${s.imgCount} 张${esc(img.name)}，${esc(layout.name)}排版</p>
      <ol class="pv-outline">${outline.map((h,i)=>`<li><span style="${layout.head}">${esc(h)}</span><em>约 ${per} 字${i===0&&s.imgCount>0?"，放第 1 张图":i===outline.length-2&&s.imgCount>1?"，放第 2 张图":""}</em></li>`).join("")}</ol>
      <p class="pv-sample">正文示意：今年前三季度，全国居民人均可支配收入 <b style="color:${layout.num}">34230 元</b>。我第一眼看到，愣了一下。</p>
    </aside>
  </div>
  ${crBrief ? `<section class="sticker" style="gap:10px"><h2>写作提纲</h2><div class="draft" id="cr-brief">${esc(crBrief)}</div>
    <div class="chips" style="gap:10px"><button class="pill" data-cr-copy>复制提纲</button><a class="pill" href="https://claude.ai/artifact/Mg7dzg3ZoovB4BX3aEYPbM#${esc(s.dir)}" target="_blank" rel="noopener">带着提纲去 Claude 版写全文（新窗口打开）</a></div></section>` : ""}`;
}
let crBrief = "";
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
function crGate(isVipOpt){ if(isVipOpt && !isVip()){ crNote = "这一项是会员功能，开通会员后可以应用。现在先给你看效果，不会真的用上。"; return false; } crNote = ""; return true; }

app.addEventListener("click", e=>{
  const o = e.target.closest("[data-cr]");
  if(o){
    const g = o.dataset.cr, v = o.dataset.val;
    if(g==="hot"){ if(crGate(true)) crSave({topic:v, title:""}); render(); return; }
    if(g==="title"){ if(crGate(true)) crSave({title:v}); render(); return; }
    if(g==="imgStyle"){ const im = CR.images.find(i=>i.id===v); if(im.vip && !isVip()){ crGate(true); render(); return; } crGate(false); crSave({imgStyle:v}); render(); return; }
    if(g==="layout"){ const l = CR.layouts.find(x=>x.id===v); if(l.vip && !isVip()){ crGate(true); render(); return; } crGate(false); crSave({layout:v}); render(); return; }
    crNote = ""; crSave({[g]: (g==="words"||g==="imgCount") ? +v : v}); render(); return;
  }
  if(e.target.closest("[data-cr-auto]")){
    const d = crDefaults(); const dir = DIRS.find(x=>x.id===d.dir);
    const hot = (topicsData && topicsData.keywords || []).filter(k=>k.niche===dir.name);
    const topic = isVip() && hot[0] ? hot[0].kw : (crState().topic || (d.dir==="minsheng" ? "公积金能交物业费了" : dir.kw.split("、")[0]));
    const title = isVip() ? makeTitles({who:d.dir==="minsheng"?"打工人":"读者", what:topic, num:"", gain:"能少走弯路"})[0].t : crState().title;
    crSave(Object.assign(d, {topic, title, imgStyle:isVip()?"photo":"data", layout:"a"}));
    crBrief = buildBrief(crState());
    crNote = isVip() ? "" : "已按免费方案自动跑完。开通会员后，自动选题会用最新热点，标题用爆款公式，还能配 AI 写实照片。";
    render(); document.getElementById("cr-brief")?.scrollIntoView({block:"center"}); return;
  }
  if(e.target.closest("[data-cr-reset]")){ patch(a=>{ a.draft = {}; }); crBrief = ""; crNote = ""; render(); return; }
  if(e.target.closest("[data-cr-brief]")){ const s = crState(); if(!s.topic){ toast("先写一个选题"); return; } crBrief = buildBrief(s); render(); document.getElementById("cr-brief")?.scrollIntoView({block:"center"}); return; }
  if(e.target.closest("[data-cr-full]")){
    if(!isVip() && points() < COST.article){ crNote = `AI 写全文要 ${COST.article} 点，你现在有 ${points()} 点。买点数后可以应用。`; render(); return; }
    if(points() < COST.article){ crNote = `点数不够：需要 ${COST.article} 点，你有 ${points()} 点。`; render(); return; }
    patch(a=>{ a.points -= COST.article; }); crNote = ""; toast(`已扣 ${COST.article} 点（演示）。演示版还没接 AI 写作，请先带着提纲去 Claude 版写。`); render(); return;
  }
  if(e.target.closest("[data-cr-copy]")){ const el = document.getElementById("cr-brief"); navigator.clipboard.writeText(el.textContent).then(()=>toast("提纲已复制")).catch(()=>{ const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast("已选中，按 Ctrl+C 复制"); }); return; }
});
app.addEventListener("change", e=>{
  if(e.target.id==="cr-topic"){ crNote = ""; crSave({topic:e.target.value.trim(), title:""}); render(); }
  if(e.target.id==="cr-title"){ crNote = ""; crSave({title:e.target.value.trim()}); render(); }
});
TOOL_PAGES.create = createPage;
