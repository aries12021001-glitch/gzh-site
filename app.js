// 公众号新手向导 · 网站演示版
// 账号和数据现在存在访问者自己的浏览器里（Store）；正式上线时把 Store 和 Auth 换成云数据库和短信接口即可，页面代码不用动。

// ===== 存储 =====
const Store = {
  get(k, d){ try{ const v = JSON.parse(localStorage.getItem("gzh:"+k)); return v ?? d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("gzh:"+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem("gzh:"+k); }catch(e){} }
};

// ===== 手机号验证码登录（演示：验证码显示在屏幕上，不发短信）=====
const PHONE_RE = /^1[3-9]\d{9}$/;
const Auth = {
  current(){ return Store.get("session", null); },
  sendCode(phone){
    const code = String(Math.floor(100000 + Math.random()*900000));
    Store.set("pending", {phone, code, expires: Date.now() + 5*60*1000});
    return code;
  },
  verify(phone, code){
    const p = Store.get("pending", null);
    if(!p || p.phone !== phone) return "请先获取验证码";
    if(Date.now() > p.expires) return "验证码已过期，请重新获取";
    if(p.code !== code) return "验证码不对，再看一眼";
    Store.del("pending");
    if(!Store.get("user:"+phone, null)) Store.set("user:"+phone, {phone, createdAt:new Date().toISOString(), direction:"", skin:"qian", progress:{}, days:{}});
    Store.set("session", phone);
    return "";
  },
  logout(){ Store.del("session"); }
};
const maskPhone = p => p ? p.slice(0,3)+"****"+p.slice(7) : "";

// ===== 当前用户的数据：登录用户存在自己的账号下，访客存在 guest 下 =====
function account(){ const ph = Auth.current(); return ph ? Store.get("user:"+ph, null) : Store.get("guest", {direction:"", skin:"qian", progress:{}, days:{}}); }
function saveAccount(a){ const ph = Auth.current(); if(ph) Store.set("user:"+ph, a); else Store.set("guest", a); }
function patch(fn){ const a = account(); fn(a); saveAccount(a); }

// ===== 页面状态 =====
let drawer = false, viewDate = "", loginStep = {phone:"", sent:false, countdown:0, err:""};
let timer = null;
const app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const route = () => (location.hash||"").replace("#","");
const tokyoDate = (d=new Date()) => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai"}).format(d);
const isMonday = () => new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",weekday:"short"}).format(new Date())==="Mon";
const shiftDate = (id, n) => { const t = new Date(id+"T12:00:00+08:00"); t.setDate(t.getDate()+n); return tokyoDate(t); };

function toast(msg, ms=3000){ const t = document.getElementById("toast"); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(()=>{ t.hidden = true; }, ms); }

// ===== 皮肤 =====
function applySkin(id){ if(!id || id==="qian") delete document.documentElement.dataset.skin; else document.documentElement.dataset.skin = id; }

// ===== 小彩纸 =====
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function confetti(x, y, n=14){
  if(reduce) return;
  const cols = ["--sun","--coral","--mint","--grape","--sky"].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v));
  for(let i=0;i<n;i++){
    const p = document.createElement("i"); p.className = "confetti"; p.style.background = cols[i%cols.length];
    p.style.left = x+"px"; p.style.top = y+"px"; document.body.appendChild(p);
    const a = Math.random()*Math.PI*2, v = 60+Math.random()*90;
    p.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:`translate(${Math.cos(a)*v}px,${Math.sin(a)*v+80}px) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:900+Math.random()*400,easing:"cubic-bezier(.2,.7,.4,1)"}).onfinish = ()=>p.remove();
  }
}

// ===== 组件 =====
const badge = d => `<span class="badge" style="background:var(--${d.c})" aria-hidden="true">${d.ch}</span>`;
const level = d => `<span class="stars" title="难度：${esc(d.level)}">${STARS[d.level]}</span> <span class="chip ${d.lv}">${esc(d.level)}</span>`;
const doneCount = id => ((account().progress||{})[id]||[]).length;

function topbar(){
  const a = account(); const mine = DIRS.find(x=>x.id===a.direction); const ph = Auth.current();
  return `<nav class="topbar" aria-label="顶部">
    <button class="brand" data-go="">公众号新手向导</button>
    <span style="flex:1"></span>
    ${mine?`<button class="pill small" data-go="${mine.id}">我的方向：${esc(mine.name)}</button>`:""}
    ${ph ? `<button class="avatar" data-open-settings aria-label="打开设置" aria-expanded="${drawer}">${esc(ph.slice(-2))}</button>`
         : `<button class="pill" data-go="login">登录 / 注册</button><button class="avatar" data-open-settings aria-label="打开设置" aria-expanded="${drawer}">客</button>`}
  </nav>`;
}

function skinPicker(){
  const cur = account().skin || "qian";
  return `<section style="display:grid;gap:10px">
    <h3>换个皮肤</h3>
    <div class="skins" role="group" aria-label="皮肤">${SKINS.map(s=>`
      <button class="skin" data-skin="${s.id}" aria-pressed="${cur===s.id}">
        <span class="disc" style="background:${s.disc}">${skinArt(s,"")}<span class="tick" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>
        <span>${esc(s.name)}</span>
      </button>`).join("")}
    </div>
  </section>`;
}

function settings(){
  if(!drawer) return "";
  const a = account(); const ph = Auth.current();
  return `<div class="scrim" data-close-settings></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="设置">
    <div style="display:flex;align-items:center;gap:10px"><h2 style="flex:1">设置</h2><button class="pill" data-close-settings aria-label="关闭设置">关闭</button></div>
    <section style="display:grid;gap:10px">
      <h3>账号</h3>
      ${ph ? `<div style="display:flex;gap:12px;align-items:center"><span class="avatar" aria-hidden="true">${esc(ph.slice(-2))}</span>
          <div><div style="font-weight:700">${maskPhone(ph)}</div><div style="font-size:13px;color:var(--muted)">注册于 ${esc((a.createdAt||"").slice(0,10))}</div></div></div>
          <button class="pill" data-logout style="justify-self:start">退出登录</button>`
        : `<p style="font-size:14px;color:var(--muted)">你还没登录。登录后，方向、进度和每日记录都存在你的账号下。</p>
           <button class="btn" data-go="login">登录 / 注册</button>`}
    </section>
    <section style="display:grid;gap:8px">
      <h3>我的方向</h3>
      <select id="set-dir" aria-label="我的方向"><option value="">还没选</option>${DIRS.map(x=>`<option value="${x.id}" ${x.id===a.direction?"selected":""}>${esc(x.name)}</option>`).join("")}</select>
      <p style="font-size:13px;color:var(--muted)">换方向不会清掉原方向的进度，切回来还在。</p>
    </section>
    ${skinPicker()}
  </aside>`;
}

// ===== 页面：首页 =====
function home(){
  const a = account(); const mine = DIRS.find(x=>x.id===a.direction);
  const sk = SKINS.find(s=>s.id===(a.skin||"qian")) || SKINS[0];
  return `
  <header class="hero">
    <div style="display:grid;gap:8px">
      <span class="bubble">嗨，小白！一起开号吧</span>
      <h1><span class="hl">公众号</span>新手向导</h1>
      <p class="lede">先挑一个适合你的方向，再照着 9 步一步步做。注册后，你的方向、进度和每天做了什么都记在自己的账号里。</p>
      ${Auth.current()?"":`<button class="btn" data-go="login">免费注册，开始记录</button>`}
    </div>
    ${skinArt(sk, "mascot")}
  </header>
  ${mine ? `<button class="dir mine" data-go="${mine.id}">${badge(mine)}<span style="font-size:12px;font-weight:900;color:var(--ok)">我的方向</span><span class="name">${esc(mine.name)} →</span><p>已完成 ${doneCount(mine.id)}/${N} 步，点进去看今天要做的事和每日记录。</p></button>` : ""}
  <div class="memo"><b>先说实话：</b>新号起步涨粉慢，流量主收入要等关注者攒够、后台开通后才有。这里不承诺收益，只帮你少走弯路。</div>
  <section style="display:grid;gap:14px">
    <h2>选方向前，先问自己 3 个问题</h2>
    <div class="qs">
      <div class="sticker"><b>我懂什么？</b><p>选你本来就懂、或者愿意天天研究的领域。写自己不懂的，读者一眼就看得出来。</p></div>
      <div class="sticker"><b>能写够 100 篇吗？</b><p>把能写的选题列出来，凑不够 30 个的方向，坚持不下去。</p></div>
      <div class="sticker"><b>有没有门槛？</b><p>健康、财经、时政这些方向需要资质或有严格规定，没有准备就别碰。</p></div>
    </div>
  </section>
  <section style="display:grid;gap:14px">
    <h2>12 个方向，挑一个</h2>
    <p style="font-size:13px;color:var(--muted);max-width:62ch">「热文」是 2026-10-26 微信 24 小时热文榜 30 篇里该方向占几篇。只有一天、30 篇，样本很小，只能参考；更多数据还在采集，11 月中旬更新。星星越多门槛越高，是编者根据门槛和规定做的判断。</p>
    <div class="grid">${DIRS.map(d=>`
      <button class="dir" data-go="${d.id}" aria-label="查看${esc(d.name)}方向">
        ${badge(d)}
        <span class="name">${esc(d.name)}</span>
        <p>${esc(d.one)}</p>
        <span class="chips">${level(d)}<span class="chip idle">热文 ${d.hot}/30</span>${doneCount(d.id)?`<span class="chip ok">已完成 ${doneCount(d.id)}/${N}</span>`:""}</span>
      </button>`).join("")}
    </div>
  </section>`;
}

// ===== 页面：登录 / 注册 =====
function loginPage(){
  const s = loginStep;
  return `
  <button class="back" data-go="">← 返回首页</button>
  <section class="sticker login">
    <h1 style="font-size:32px">登录 / 注册</h1>
    <p style="font-size:14px;color:var(--muted)">用手机号就行，没注册过的号码会自动注册。</p>
    <form id="login-form" novalidate style="display:grid;gap:14px">
      <label>手机号<input id="lg-phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" placeholder="11 位手机号" value="${esc(s.phone)}"></label>
      <label>验证码<span class="row"><input id="lg-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位数字"><button type="button" class="pill" data-send-code ${s.countdown>0?"disabled":""}>${s.countdown>0?`${s.countdown} 秒后重发`:(s.sent?"重新获取":"获取验证码")}</button></span></label>
      <label class="agree"><input type="checkbox" id="lg-agree"> <span>我知道这是演示版：账号和数据只存在这台设备的浏览器里，清理浏览器数据后会丢失。</span></label>
      ${s.err?`<p class="err" role="alert">${esc(s.err)}</p>`:""}
      <button class="btn" type="submit">登录</button>
    </form>
  </section>`;
}

// ===== 页面：方向 =====
function page(d){
  const a = account(); const done = new Set((a.progress||{})[d.id]||[]); const pct = Math.round(done.size/N*100);
  return `
  <button class="back" data-go="">← 返回选方向</button>
  <header style="display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center">
    <span class="badge" style="background:var(--${d.c});width:72px;height:72px;font-size:36px" aria-hidden="true">${d.ch}</span>
    <div style="display:grid;gap:4px;min-width:0">
      <h1 style="font-size:clamp(28px,6vw,40px)">${esc(d.name)}</h1>
      <div class="chips">${level(d)}<span class="chip idle">热文 ${d.hot}/30</span>${d.ready?'<span class="chip ok">已有完整示范</span>':'<span class="chip warn">方向数据积累中</span>'}</div>
    </div>
  </header>
  <p style="color:var(--muted)">${esc(d.one)}</p>
  ${a.direction===d.id ? `<p style="font-family:var(--display);font-size:18px;color:var(--ok)">✓ 这是你的方向，加油！</p>` : `<button class="btn" data-setdir="${d.id}">就选这个方向</button>`}
  ${a.direction===d.id ? daily(d) : ""}
  <section class="sticker" style="gap:10px">
    <h2>写文章</h2>
    <p style="font-size:14px;color:var(--muted)">写文章暂时用 Claude 版：粘贴官方原文资料，Claude 只用资料里的数字写，缺的地方标【待补】，写完自动按去 AI 味标准打分。需要能访问 claude.ai 并登录。</p>
    <a class="btn" href="https://claude.ai/artifact/Mg7dzg3ZoovB4BX3aEYPbM#${d.id}" target="_blank" rel="noopener" style="text-decoration:none">去 Claude 版写文章 ↗</a>
  </section>
  <div class="two">
    <div class="sticker"><dl><dt>适合谁</dt><dd>${esc(d.who)}</dd><dt>真实爆文</dt><dd>${esc(d.example)}</dd><dt>可以搜</dt><dd>${esc(d.kw)}</dd></dl></div>
    <div class="sticker red"><h3>先看红线</h3><ul class="rules">${d.red.map(r=>`<li>${esc(r)}</li>`).join("")}</ul></div>
  </div>
  <section style="display:grid;gap:14px">
    <div style="display:grid;gap:8px">
      <h2>9 步做起来</h2>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${done.size}" aria-label="完成进度"><i style="width:${pct}%"></i></div>
      <p style="font-size:13px;color:var(--muted)">${done.size===N?"全部完成，太棒了！":`已完成 ${done.size}/${N}`}　${Auth.current()?"进度存在你的账号下":"还没登录，进度先存在访客模式里"}</p>
    </div>
    <ol class="flow">${STEPS.map((s,i)=>`
      <li class="step${done.has(i)?" done":""}">
        <input class="stamp" type="checkbox" id="s-${d.id}-${i}" data-step="${i}" ${done.has(i)?"checked":""} aria-label="第 ${i+1} 步已完成">
        <div class="body">
          <h3><label for="s-${d.id}-${i}" style="cursor:pointer"><span class="num">${i+1}</span>${esc(s.t)}</label></h3>
          <dl><dt>怎么做</dt><dd>${esc(s.do)}</dd><dt>做对了</dt><dd>${esc(s.ok)}</dd></dl>
          ${s.kw?`<p style="font-size:14px">本方向可以搜：<b>${esc(d.kw)}</b></p>`:""}
          ${s.table?`<div class="tbl"><table><thead><tr><th>开头句式</th><th>骨架</th></tr></thead><tbody>${s.table.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div><p style="font-size:14px">本方向的真实爆文：${esc(d.example)}</p><p style="font-size:14px;color:var(--bad);font-weight:700">${esc(s.rule)}</p>`:""}
          ${s.minsheng && d.ready?`<p class="mine-note">${esc(s.minsheng)}</p>`:""}
          ${s.minsheng && !d.ready && i===4?`<p class="pending">本方向的写作标准还在根据真实爆文整理，11 月中旬补上。</p>`:""}
          ${s.link?`<p style="font-size:14px"><a href="${s.link[1]}" target="_blank" rel="noopener">${esc(s.link[0])} ↗</a></p>`:""}
          ${s.tip?`<p class="tip">小提示：${esc(s.tip)}</p>`:""}
        </div>
      </li>`).join("")}
    </ol>
  </section>`;
}

// ===== 每日记录：可按日期查看，只有今天能打勾 =====
function daily(d){
  const a = account(); const days = a.days || {};
  const today = tokyoDate(); const vd = viewDate || today; const isToday = vd===today;
  const t = days[vd] || {}; const you = t.you || {};
  const youItems = YOU_DAILY.filter(x=>!x.monday || (isToday ? isMonday() : !!you[x.key]));
  const marks = Object.keys(days).filter(k=>k!==vd && Object.values(days[k].you||{}).some(Boolean)).sort().reverse().slice(0,10);
  return `
  <section style="display:grid;gap:14px">
    <h2>每日记录</h2>
    <div class="datebar">
      <button class="pill" data-day="${shiftDate(vd,-1)}" aria-label="前一天">← 前一天</button>
      <input type="date" id="day-pick" value="${vd}" max="${today}" aria-label="选择日期">
      <button class="pill" data-day="${shiftDate(vd,1)}" ${isToday?"disabled":""} aria-label="后一天">后一天 →</button>
      ${isToday?`<span class="chip ok">今天</span>`:`<button class="pill" data-day="${today}">回到今天</button>`}
    </div>
    ${marks.length?`<div class="chips" style="gap:8px"><span style="font-size:13px;color:var(--muted)">有记录的日子：</span>${marks.map(k=>`<button class="pill small" data-day="${k}">${k.slice(5)}</button>`).join("")}</div>`:""}
    <div class="two">
      <div class="sticker" style="background:var(--sun-soft)"><h3>Claude ${isToday?"今天做":"这天做了"}</h3>
        <ul class="task">${CLAUDE_DAILY.map(c=>`<li><div>${esc(c.t)}</div><div><span class="chip idle">正式上线后接入</span></div></li>`).join("")}</ul>
        <p style="font-size:13px;color:var(--muted)">演示版还没有接自动采集和写稿任务，上线后这里会自动显示每次运行的真实结果。</p>
      </div>
      <div class="sticker" style="background:var(--mint-soft)"><h3>你${isToday?"今天做":"这天做了"}</h3>
        ${isToday?`<ul class="task">${youItems.map(y=>`<li><label><input class="stamp mini" type="checkbox" data-you="${y.key}" ${you[y.key]?"checked":""}><span>${esc(y.t)}</span></label></li>`).join("")}</ul>`
          :(youItems.length?`<ul class="task">${youItems.map(y=>`<li>✓ ${esc(y.t)}</li>`).join("")}</ul>`:`<p style="font-size:14px;color:var(--muted)">这天没有打勾记录。</p>`)}
      </div>
    </div>
  </section>`;
}

// ===== 渲染 =====
function render(){
  applySkin(account().skin);
  const id = route(); const d = DIRS.find(x=>x.id===id);
  const body = id==="login" ? (Auth.current() ? home() : loginPage()) : (d ? page(d) : home());
  app.innerHTML = topbar() + body + `
  <footer><span>数据来源：今日热榜·微信 24 小时热文榜（2026-10-26 快照）、搜狗微信搜索。不登录、不绕过任何验证。</span><span>演示版 · 2026-10-28</span></footer>` + settings();
}

function startCountdown(){
  clearInterval(timer); loginStep.countdown = 60;
  timer = setInterval(()=>{ loginStep.countdown--; const b = document.querySelector("[data-send-code]");
    if(b){ b.disabled = loginStep.countdown>0; b.textContent = loginStep.countdown>0 ? `${loginStep.countdown} 秒后重发` : "重新获取"; }
    if(loginStep.countdown<=0) clearInterval(timer); }, 1000);
}

app.addEventListener("click", e=>{
  if(e.target.closest("[data-open-settings]")){ drawer = true; render(); document.querySelector(".drawer [data-close-settings]")?.focus(); return; }
  if(e.target.closest("[data-close-settings]")){ drawer = false; render(); document.querySelector(".topbar .avatar")?.focus(); return; }
  if(e.target.closest("[data-logout]")){ Auth.logout(); drawer = false; toast("已退出登录"); render(); return; }
  if(e.target.closest("[data-send-code]")){
    const phone = document.getElementById("lg-phone").value.trim(); loginStep.phone = phone;
    if(!PHONE_RE.test(phone)){ loginStep.err = "手机号格式不对，要 11 位、以 1 开头"; render(); return; }
    const code = Auth.sendCode(phone); loginStep.sent = true; loginStep.err = ""; render(); startCountdown();
    toast(`演示版验证码：${code}（正式版会发短信）`, 8000); document.getElementById("lg-code")?.focus(); return;
  }
  const sd = e.target.closest("[data-setdir]"); if(sd){ patch(a=>{ a.direction = sd.dataset.setdir; }); render(); confetti(innerWidth/2, 200, 30); return; }
  const sk = e.target.closest("button[data-skin]"); if(sk){ patch(a=>{ a.skin = sk.dataset.skin; }); render();
    const b = document.querySelector(`button[data-skin="${sk.dataset.skin}"]`); if(b){ b.focus(); const r = b.getBoundingClientRect(); confetti(r.left+r.width/2, r.top+30, 16); } return; }
  const dy = e.target.closest("[data-day]"); if(dy){ const today = tokyoDate(); viewDate = dy.dataset.day > today ? today : dy.dataset.day; render(); return; }
  const g = e.target.closest("[data-go]"); if(!g) return;
  drawer = false; viewDate = "";
  if(route() === g.dataset.go) render(); else location.hash = g.dataset.go;
  window.scrollTo(0,0);
});

app.addEventListener("submit", e=>{
  if(e.target.id !== "login-form") return;
  e.preventDefault();
  const phone = document.getElementById("lg-phone").value.trim(), code = document.getElementById("lg-code").value.trim();
  loginStep.phone = phone;
  if(!PHONE_RE.test(phone)){ loginStep.err = "手机号格式不对，要 11 位、以 1 开头"; render(); return; }
  if(!document.getElementById("lg-agree").checked){ loginStep.err = "请先勾选「我知道这是演示版」"; render(); return; }
  const err = Auth.verify(phone, code);
  if(err){ loginStep.err = err; render(); return; }
  // 访客时做的进度，登录后并入账号
  const guest = Store.get("guest", null);
  if(guest){ patch(a=>{ a.direction = a.direction || guest.direction; for(const k in (guest.progress||{})){ a.progress[k] = [...new Set([...(a.progress[k]||[]), ...guest.progress[k]])].sort((x,y)=>x-y); } }); Store.del("guest"); }
  loginStep = {phone:"", sent:false, countdown:0, err:""}; clearInterval(timer);
  toast(`登录成功，欢迎 ${maskPhone(phone)}`); location.hash = account().direction || "";
  render();
});

document.addEventListener("keydown", e=>{ if(e.key==="Escape" && drawer){ drawer = false; render(); } });

app.addEventListener("change", e=>{
  if(e.target.id==="day-pick"){ viewDate = e.target.value || ""; render(); return; }
  if(e.target.id==="set-dir"){ patch(a=>{ a.direction = e.target.value; }); render(); return; }
  const r = e.target.getBoundingClientRect();
  const yu = e.target.closest("input[data-you]"); if(yu){ const id = tokyoDate();
    patch(a=>{ a.days = a.days||{}; a.days[id] = a.days[id]||{date:id}; a.days[id].you = Object.assign({}, a.days[id].you, {[yu.dataset.you]:yu.checked}); });
    if(yu.checked) confetti(r.left+r.width/2, r.top, 10); render(); return; }
  const c = e.target.closest("input[data-step]"); if(!c) return;
  const id = route(); const i = +c.dataset.step; let size = 0;
  patch(a=>{ a.progress = a.progress||{}; const s = new Set(a.progress[id]||[]); c.checked ? s.add(i) : s.delete(i); a.progress[id] = [...s].sort((x,y)=>x-y); size = s.size; });
  if(c.checked) confetti(r.left+r.width/2, r.top, size===N?60:14);
  render(); document.getElementById(`s-${id}-${i}`)?.focus();
});

window.addEventListener("hashchange", ()=>{ drawer = false; render(); window.scrollTo(0,0); });
render();
