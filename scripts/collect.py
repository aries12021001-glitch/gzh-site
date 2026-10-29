"""搜狗微信关键词采集（GitHub Actions 每 3 小时运行一次）。

规则：
- 只读搜索结果页，不登录、不绕过验证码或反爬。页面出现 antispider / 验证码就立刻停下，下次从被拦的词续抓。
- 请求之间随机等待 8~15 秒。
- 民生钱袋子 12 个词每次都抓；其他 30 个词每次轮流抓 10 个。
- 只保存每个词最近一次的结果和近 14 天的热度趋势，写入 topics.json 给网站「热点选题」用。
"""
import datetime as dt
import html
import json
import pathlib
import random
import re
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "topics.json"
STATE = ROOT / "data" / "state.json"
CN = dt.timezone(dt.timedelta(hours=8))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

MAIN = ("民生钱袋子", "社保 养老金 医保 公积金 个税 退休 工资 存款利率 金价 油价 消费维权 补贴".split())
OTHERS = [
    ("健康科普辟谣", "养生 辟谣 体检"), ("情感家庭", "婚姻 中年 父母"), ("娱乐影视明星", "明星 电视剧 综艺"),
    ("体育", "足球 篮球 亚运会"), ("时政国际军事", "国际局势 军事"), ("科技数码AI", "人工智能 手机 AI工具"),
    ("财经股市", "股市 基金 房价"), ("社会新闻", "法院判决 热点事件"), ("生活旅行美食", "美食 旅行 穿搭"),
    ("教育职场", "高考 考公 职场"), ("游戏电竞", "游戏 电竞"),
]
OTHER_KWS = [(n, k) for n, ks in OTHERS for k in ks.split()]
OTHERS_PER_RUN = 10
KEEP_DAYS = 14


def fetch(keyword):
    url = "https://weixin.sogou.com/weixin?type=2&query=" + urllib.parse.quote(keyword)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "ignore")


def parse(page):
    titles = [html.unescape(re.sub(r"<[^>]+>", "", t)).strip() for t in re.findall(r"<h3>\s*<a[^>]*>(.*?)</a>", page, re.S)]
    accounts = [html.unescape(a).strip() for a in re.findall(r'class="all-time-y2">([^<]+)<', page)]
    times = [int(t) for t in re.findall(r"timeConvert\('(\d+)'\)", page)]
    rows = []
    for i, t in enumerate(titles):
        if not t:
            continue
        ts = times[i] if i < len(times) else None
        rows.append({"t": t[:60], "a": accounts[i] if i < len(accounts) else "",
                     "ts": ts})
    return rows, len(titles) != len(times)


def load(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def main():
    now = dt.datetime.now(CN)
    state = load(STATE, {"next_other": 0, "runs": []})
    data = load(OUT, {"keywords": []})
    by_kw = {k["kw"]: k for k in data.get("keywords", []) if "kw" in k}

    start = state.get("next_other", 0) % len(OTHER_KWS)
    plan = [(MAIN[0], k, None) for k in MAIN[1]] + \
           [(OTHER_KWS[(start + i) % len(OTHER_KWS)][0], OTHER_KWS[(start + i) % len(OTHER_KWS)][1], (start + i) % len(OTHER_KWS))
            for i in range(OTHERS_PER_RUN)]

    done, empty, misaligned, blocked_at = [], [], [], None
    next_other = (start + OTHERS_PER_RUN) % len(OTHER_KWS)
    for n, (niche, kw, other_idx) in enumerate(plan):
        if n:
            time.sleep(random.uniform(8, 15))
        try:
            page = fetch(kw)
        except Exception as e:  # 网络错误：记下来，不重试
            print(f"{kw}: 请求失败 {e}")
            continue
        if "antispider" in page or "验证码" in page:
            blocked_at = kw
            if other_idx is not None:
                next_other = other_idx
            print(f"{kw}: 被搜狗拦截，停止本次采集")
            break
        rows, bad = parse(page)
        if not rows:
            empty.append(kw)
        if bad:
            misaligned.append(kw)
        fresh = lambda days: sum(1 for r in rows if r["ts"] and (now.timestamp() - r["ts"]) <= days * 86400)
        rec = by_kw.get(kw, {"kw": kw, "niche": niche, "trend": {}})
        rec.update({"niche": niche, "at": now.strftime("%Y-%m-%d %H:%M"), "total": len(rows), "f3": fresh(3), "f7": fresh(7),
                    "recent": [{"t": r["t"], "a": r["a"], "d": dt.datetime.fromtimestamp(r["ts"], CN).strftime("%Y-%m-%d")}
                               for r in sorted([r for r in rows if r["ts"]], key=lambda r: -r["ts"])[:3]]})
        trend = rec.setdefault("trend", {})
        trend[now.strftime("%Y-%m-%d")] = rec["f3"]
        cutoff = (now - dt.timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")
        rec["trend"] = {d: v for d, v in sorted(trend.items()) if d >= cutoff}
        by_kw[kw] = rec
        done.append(kw)
        print(f"{kw}: {len(rows)} 篇，3 天内 {rec['f3']} 篇")

    keywords = sorted(by_kw.values(), key=lambda k: (-k.get("f3", 0), -k.get("f7", 0)))
    out = {
        "generated_at": now.isoformat(timespec="minutes"),
        "source": "搜狗微信搜索，每个关键词看搜索结果第一页（约 10 篇）。民生钱袋子的词每 3 小时更新，其他方向每天 2~3 次",
        "note": "「3 天内新文」= 最近一次搜索的第一页里，有几篇是 3 天内发的。越多说明最近写这个话题的号越多、话题越新鲜；它不代表阅读量。",
        "keywords": keywords,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")

    state["next_other"] = next_other
    state["runs"] = (state.get("runs", []) + [{"at": now.isoformat(timespec="minutes"), "ok": len(done), "planned": len(plan),
                                                "blocked_at": blocked_at, "empty": empty, "misaligned": misaligned}])[-60:]
    STATE.parent.mkdir(exist_ok=True)
    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"完成 {len(done)}/{len(plan)}，被拦：{blocked_at or '无'}，空结果：{empty or '无'}")


if __name__ == "__main__":
    main()
