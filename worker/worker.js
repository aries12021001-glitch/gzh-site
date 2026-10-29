// 「写一篇」的 AI 中转：网页 → 这里 → Claude API。
// 部署在 Cloudflare Workers。密钥和口令只存在 Cloudflare 的「变量和机密」里，不写进代码：
//   ANTHROPIC_API_KEY  Anthropic 控制台创建的 API 密钥
//   PASSCODE           写作口令（演示期只给站长自己用，防止别人花你的钱）
// 写作要求固定写在这里，网页只能传几个选项，别人拿到网址也没法拿它干别的。

const ALLOWED_ORIGINS = ["https://aries12021001-glitch.github.io", "http://localhost:8765"];
const MODEL = "claude-opus-5-5";

// 只从官方和权威媒体网站搜资料（子域名自动包含）
const OFFICIAL = [
  "gov.cn", "stats.gov.cn", "mohrss.gov.cn", "nhsa.gov.cn", "pbc.gov.cn", "nfra.gov.cn", "csrc.gov.cn",
  "chinatax.gov.cn", "mof.gov.cn", "ndrc.gov.cn", "samr.gov.cn", "mohurd.gov.cn", "moe.gov.cn",
  "nhc.gov.cn", "mca.gov.cn", "court.gov.cn", "12315.cn", "people.com.cn", "xinhuanet.com", "news.cn",
  "cctv.com", "chinanews.com.cn", "gmw.cn", "ce.cn", "cnr.cn"
];

const DIRS = {
  minsheng: {name:"民生钱袋子", who:"35~60 岁的中年家庭", persona:"一个努力生活、爱算账的苦命打工人"},
  health: {name:"健康科普辟谣"}, emotion: {name:"情感家庭"}, ent: {name:"娱乐影视明星"}, sport: {name:"体育"},
  politics: {name:"时政国际军事"}, tech: {name:"科技数码AI"}, finance: {name:"财经股市"}, society: {name:"社会新闻"},
  life: {name:"生活旅行美食"}, edu: {name:"教育职场"}, game: {name:"游戏电竞"}
};
const TYPES = {
  "实用文": "读者读完要能直接去办、去领、去避坑：谁能办、去哪办、要带什么、多久到账，一步一步写清楚。",
  "疼文": "用官方统计数据说出普通人的处境；不编故事，不贴群体标签，不放大恐慌；结尾给 3 条能做的出路。",
  "干货文": "把一件事讲清楚、讲到读者能照着做。",
  "观点文": "给出明确的看法和理由，也写反方怎么说。"
};
const IMG = {data:"数据图卡（把关键数字做成图）", text:"文字金句卡", line:"简笔插画", photo:"不露脸的生活场景照片"};

const SYSTEM = `你是公众号写手，替新手写一篇能直接发的文章。

资料规矩（最重要）：
- 先用网页搜索去官方网站查这个选题的原文和最新数据，需要时用网页读取打开原文核对。
- 文中每个数字、每条政策都必须来自你这次搜到的官方或权威媒体原文，并在【出处】里给出链接。
- 搜不到的就写【待补：需要什么数据】，绝不自己编，也不凭记忆写数字。
- 政策要写清是哪一年、哪个部门、适用哪里；地方政策不要写成全国都适用。

写法：
- 不编造任何个人经历、对话、案例；可以写「我算了一下」，但必须是基于资料的计算，并且要算对。
- 不冒充医生、律师等有资质的身份；不承诺收益，不荐股。
- 去 AI 味：多用「我」和口语（咱、啥、说白了、其实），长短句交替，至少 2 个问句；不要用「首先、其次、综上所述、值得注意的是、总而言之、在这个时代、赋能、助力」这类套话。
- 段落短，每段 2~4 行。

严格按这个格式输出，不要输出别的内容：
【标题】
三个候选标题，每行一个，行首写公式名和竖线，如「揭示真相｜……」。公式从「设问痛点、颠覆常识、揭示真相、时代情绪、身份恭喜、官方确认金额」中选。如果用户给了标题，第一行用用户的标题，公式名写「用户标题」。
【正文】
正文。小标题单独一行，以「## 」开头。配图位置单独一行，写「【配图N：画面描述】」。
【出处】
每行一条：资料名称 + 链接。`;

function cors(origin){
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
const clip = (s, n) => String(s || "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

function buildUser(o){
  const d = DIRS[o.dir] || DIRS.minsheng;
  const today = new Intl.DateTimeFormat("zh-CN", {timeZone:"Asia/Shanghai", year:"numeric", month:"long", day:"numeric"}).format(new Date());
  return `今天是 ${today}。
方向：${d.name}。读者：${d.who || "这个方向的普通读者"}。人设：${d.persona || "作者本人，语气真诚，不编造身份"}。
选题：${o.topic}
${o.title ? `用户定的标题：${o.title}` : "标题：请你起三个候选。"}
文章类型：${o.type}。${TYPES[o.type]}
字数：正文约 ${o.words} 字，分 ${o.words <= 800 ? "2~3" : o.words <= 1200 ? "3~4" : "4~5"} 个小标题。
配图：${o.imgCount} 张${IMG[o.imgStyle]}，在正文里标出位置和画面。`;
}

// 把 Claude 的流（SSE）转成网页好读的一行一个 JSON：
// {"t":"正文片段"}  {"s":"正在搜索：…"}  {"src":[{title,url}]}  {"done":true,"stop":"end_turn"}  {"err":"…"}
function transform(upstream){
  const enc = new TextEncoder(), dec = new TextDecoder();
  let buf = "", toolJson = "", toolName = "";
  const sources = new Map();
  return upstream.pipeThrough(new TransformStream({
    transform(chunk, ctl){
      buf += dec.decode(chunk, {stream:true});
      let i;
      while((i = buf.indexOf("\n\n")) >= 0){
        const evt = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = evt.split("\n").find(l => l.startsWith("data: "));
        if(!line) continue;
        let m; try{ m = JSON.parse(line.slice(6)); }catch(e){ continue; }
        const out = x => ctl.enqueue(enc.encode(JSON.stringify(x) + "\n"));
        if(m.type === "content_block_start"){
          const b = m.content_block;
          if(b.type === "server_tool_use"){ toolName = b.name; toolJson = ""; }
          if(b.type === "web_search_tool_result" && Array.isArray(b.content)){
            b.content.forEach(r => { if(r.url) sources.set(r.url, r.title || r.url); });
          }
        }
        if(m.type === "content_block_delta"){
          if(m.delta.type === "text_delta") out({t: m.delta.text});
          if(m.delta.type === "input_json_delta") toolJson += m.delta.partial_json;
        }
        if(m.type === "content_block_stop" && toolName){
          let q = ""; try{ const j = JSON.parse(toolJson || "{}"); q = j.query || j.url || ""; }catch(e){}
          out({s: (toolName === "web_search" ? "正在搜索：" : "正在读取原文：") + q});
          toolName = "";
        }
        if(m.type === "message_delta" && m.delta && m.delta.stop_reason){
          out({src: [...sources].slice(0, 30).map(([url, title]) => ({url, title}))});
          out({done: true, stop: m.delta.stop_reason});
        }
        if(m.type === "error") out({err: (m.error && m.error.message) || "Claude 出错了"});
      }
    }
  }));
}

export default {
  async fetch(req, env){
    const origin = req.headers.get("Origin") || "";
    const h = cors(origin);
    if(req.method === "OPTIONS") return new Response(null, {headers: h});
    if(req.method !== "POST") return new Response("只接受 POST", {status: 405, headers: h});
    if(!ALLOWED_ORIGINS.includes(origin)) return new Response("来源不允许", {status: 403, headers: h});

    let o; try{ o = await req.json(); }catch(e){ return new Response("请求格式不对", {status: 400, headers: h}); }
    if(!env.PASSCODE || o.passcode !== env.PASSCODE) return new Response("口令不对", {status: 401, headers: h});
    o = {
      dir: DIRS[o.dir] ? o.dir : "minsheng",
      type: TYPES[o.type] ? o.type : "实用文",
      words: [800, 1200, 1500, 1800].includes(+o.words) ? +o.words : 1200,
      imgStyle: IMG[o.imgStyle] ? o.imgStyle : "data",
      imgCount: Math.min(4, Math.max(1, +o.imgCount || 2)),
      topic: clip(o.topic, 60), title: clip(o.title, 60)
    };
    if(!o.topic) return new Response("缺少选题", {status: 400, headers: h});

    const api = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2026-10-21",
        "anthropic-beta": "server-side-fallback-2026-07-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 32000,
        stream: true,
        thinking: {type: "adaptive"},
        output_config: {effort: "medium"},
        fallbacks: "default",
        system: SYSTEM,
        tools: [
          {type: "web_search_20260209", name: "web_search", max_uses: 6, allowed_domains: OFFICIAL},
          {type: "web_fetch_20260209", name: "web_fetch", max_uses: 4, allowed_domains: OFFICIAL}
        ],
        messages: [{role: "user", content: buildUser(o)}]
      })
    });
    if(!api.ok){
      const t = await api.text();
      return new Response(JSON.stringify({err: `Claude API 返回 ${api.status}：${t.slice(0, 300)}`}) + "\n", {status: 502, headers: {...h, "content-type": "application/x-ndjson; charset=utf-8"}});
    }
    return new Response(transform(api.body), {headers: {...h, "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store"}});
  }
};
