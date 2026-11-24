"""Redis Patterns explainer: distributed lock (SET NX PX, Lua unlock, Redisson RLock), rate limit, MULTI/WATCH/Lua and
pipelining, TTL and eviction, persistence and scaling.

Every number comes from the lesson (web/src/data/lessons/redis-patterns.ts), which ran them on Redis 8.6.2 / 7.4,
Spring Boot 3.5.16 and Redisson 4.8.0:
lock: DEL from A removes B's lock; Lua unlock A tokenA -> 0, B tokenB -> 1;
flash sale 10 items, 100 buyers: no lock 100 orders, synchronized on 2 instances 20, RLock 10 (370-410 ms),
watchdog 30000 ms, PTTL 19975 at 10 s -> 28051 at 12 s; leaseTime 10 s -> PTTL -2 at 10 s; UPDATE ... qty > 0: 10 orders, 11-12 ms;
this.buyLocked(): 100 orders;
rate limit: INCR 1..6, TTL ~60; ZSET 3 per 10 s: 1000, 1002, 1004 pass, 1005 rejected, 1011 passes; ZADD same member x3 -> ZCARD 1;
MULTI: EXEC -> 0, WRONGTYPE, -1; WATCH: EXEC nil, stock stays 0; Lua: 1 then 0, stock 0;
pipelining: 7204 SET/s (-P 1), 91075 (-P 16), 552486 (-P 100), about 77x;
eviction: maxmemory 8mb, 100000 keys: noeviction ~46500 ok / ~53500 OOM; allkeys-lru all OK, ~54800 evicted, ~45400 left;
SET PX 300 -> nil after 0.5 s;
RDB save 3600 1000 + kill -9 after 2 s -> key lost; AOF everysec -> key kept;
cluster: 16384 slots, KEYSLOT user:1 10778, user:2 6777, MGET a b CROSSSLOT, {user:1}:profile and {user:1}:cart both 10778.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def when(spoken, phrase):
    """Seconds into the narration (at ~14.5 chars/s) where `phrase` starts; fit_to_audio rescales to the real take."""
    return round(spoken.index(phrase) / 14.5, 2)


def B(spoken, caption, fn):
    """A beat whose actions are built from the sentence, so reveals land on the words they illustrate."""
    return (spoken, caption, fn(lambda p: when(spoken, p)))


def S(*names):
    return ", ".join("#" + n for n in names)


def AR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


def row(label, text):
    return f'<span class="mono big" style="font-size:40px">{label}</span><span style="font-size:34px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=32):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=32):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600">{esc(text)}</span>', tone)


def titled(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=40):
    inner = (f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700">{esc(main)}</span>'
    inner += f'<span class="mono" style="font-size:28px;color:var(--muted)">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} left r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:52px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def bar(id_, x, y, w, h=56):
    return el(id_, x, y, w, h, "", "r", "border-radius:10px;background:linear-gradient(90deg,#9aa3b5,#eef1f6)")


TOPICS = [("Khoá phân tán", "SET NX PX · Redisson"), ("Rate limit", "INCR · Sorted Set"), ("Nguyên tử", "MULTI · Lua · pipeline"),
          ("Eviction", "TTL · hết bộ nhớ"), ("Lưu trữ", "RDB · AOF · Cluster")]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Redis Patterns · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Redis không chỉ là cache"), "h1 r", "font-size:110px"),
        titled("hk-s1", 260, 420, 400, 200, "kho", "10 món", "", "cyan", 52),
        titled("hk-s2", 760, 420, 400, 200, "người mua", "100", "", "amber", 52),
        titled("hk-s3", 1260, 420, 400, 200, "server", "2 instance", "", "violet", 52),
        *[box(f"hk-c{i}", 85 + i * 355, 400, 330, 300,
              f'<b style="font-size:34px">{n}</b><span style="font-size:26px;color:var(--muted);text-align:center">{d}</span>', "cyan", "card")
          for i, (n, d) in enumerate(TOPICS)],
        chip("hk-p1", 560, 800, "Lệnh chạy thật", "green"),
        chip("hk-p2", 1100, 800, "Bẫy hay bị hỏi", "amber"),
    ]), beats=[
        B("Câu hỏi phỏng vấn: flash sale còn mười món, một trăm người bấm mua cùng lúc, và ứng dụng chạy hai instance. Làm sao không bán vượt?",
          "Kho 10 món, 100 người mua, 2 instance. Làm sao không bán vượt?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05), IN("#hk-s1", "pop", w("còn mười")),
                     IN("#hk-s2", "pop", w("một trăm")), IN("#hk-s3", "pop", w("hai instance"))]),
        B("Câu trả lời đi qua những mẫu Redis hay bị hỏi nhất: khoá phân tán, rate limit, nguyên tử với Multi và Lua, eviction khi hết bộ nhớ, và lưu trữ.",
          "Khoá phân tán · rate limit · nguyên tử · eviction · lưu trữ.",
          lambda w: [OUT(S("hk-s1", "hk-s2", "hk-s3"), "blur", 0, 0.4),
                     IN("#hk-c0", "pop", w("khoá phân tán")), IN("#hk-c1", "pop", w("rate limit")), IN("#hk-c2", "pop", w("nguyên tử")),
                     IN("#hk-c3", "pop", w("eviction")), IN("#hk-c4", "pop", w("và lưu trữ"))]),
        B("Mọi con số trong bài đều từ lệnh chạy thật, và mỗi mẫu có một cái bẫy hay bị hỏi.",
          "Lệnh chạy thật, và một cái bẫy cho mỗi mẫu.",
          lambda w: [IN("#hk-p1", "up", w("lệnh chạy")), IN("#hk-p2", "pop", w("một cái bẫy"))]),
    ]),
    # ------------------------------------------------------------ lock
    dict(id="lock", world=(1920, 1080), hud="", cam="".join([
        head("lk", "Khoá phân tán", "SET NX PX và mở khoá an toàn"),
        rule("lk-rule", "Chỉ một tiến trình làm việc tại một thời điểm", "Khoá phải có thời hạn, và chỉ người giữ mới được mở"),
        cbox("lk-bad", 90, 270, 1000, "redis-cli",
             "SETNX lock:order1 1\n"
             "EXPIRE lock:order1 30\n"
             "...\n"
             "DEL lock:order1", "violet", 34),
        bigerr("lk-err", 1160, 300, 670, "✕ Chết giữa hai lệnh:<br>khoá không bao giờ hết hạn", 34),
        tag("lk-good", 90, 270, 1740, 110, "SET lock:order1 tokenA NX PX 30000", "green", 44),
        titled("lk-n1", 90, 430, 540, 170, "NX", "một người giữ", "", "cyan", 40),
        titled("lk-n2", 690, 430, 540, 170, "PX ttl", "tự hết hạn", "", "cyan", 40),
        titled("lk-n3", 1290, 430, 540, 170, "token", "biết ai là chủ", "", "cyan", 40),
        tag("lk-a1", 90, 430, 1740, 100, "A giữ khoá, làm quá lâu, khoá hết hạn", "cyan", 34),
        tag("lk-a2", 90, 550, 1740, 100, "B lấy được khoá", "cyan", 34),
        tag("lk-a3", 90, 670, 1740, 100, "A gọi DEL lock:order1 thẳng → 1: xoá khoá của B", "red", 34),
        cbox("lk-lua", 90, 430, 1000, "unlock.lua",
             "if redis.call('get', KEYS[1]) == ARGV[1] then\n"
             "  return redis.call('del', KEYS[1])\n"
             "else\n"
             "  return 0\n"
             "end", "violet", 32),
        tag("lk-r1", 1160, 470, 670, 110, "A, tokenA → 0", "amber", 36),
        tag("lk-r2", 1160, 610, 670, 110, "B, tokenB → 1", "green", 36),
        titled("lk-f1", 90, 270, 540, 250, "không khoá", "100 đơn", "kho còn 8 hoặc 9", "red", 56),
        titled("lk-f2", 690, 270, 540, 250, "synchronized · 2 instance", "20 đơn", "kho 0, bán gấp đôi", "red", 56),
        titled("lk-f3", 1290, 270, 540, 250, "Redisson RLock", "10 đơn", "370 đến 410 ms", "green", 56),
        tag("lk-w1", 90, 580, 1740, 100, "watchdog: PTTL 19975 ở giây 10 → 28051 ở giây 12", "green", 34),
        tag("lk-w2", 90, 700, 1740, 100, "truyền leaseTime 10 giây: giây 10 PTTL = -2, khoá mất", "red", 34),
        tag("lk-u1", 90, 580, 1740, 100, "UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0", "amber", 34),
        tag("lk-u2", 90, 700, 1740, 100, "10 đơn trong 11 đến 12 ms", "green", 36),
        el("lk-t1", 0, 400, 1920, None, letters("Thời hạn và token"), "take r"),
        el("lk-t2", 0, 540, 1920, None, "SET NX PX · mở bằng Lua · nhiều instance: RLock", "take-sm r"),
    ]), beats=[
        B("Khoá phân tán cho chỉ một tiến trình trên nhiều server làm một việc. Khoá phải có thời hạn, và chỉ người giữ mới được mở.",
          "Khoá phân tán: có thời hạn, chỉ người giữ mới được mở.",
          lambda w: [IN("#lk-eye", "blur"), TYPE("#lk-q", 0.2, 0.05), IN("#lk-rule", "up", w("Khoá phải"))]),
        B("Cách sai hay gặp: SETNX rồi mới EXPIRE. Tiến trình chết giữa hai lệnh thì khoá không bao giờ hết hạn.",
          "SETNX rồi EXPIRE: chết giữa hai lệnh, khoá treo mãi.",
          lambda w: [OUT("#lk-rule", "blur", 0, 0.4), *shrink("lk", 0), IN("#lk-bad", "blur", 0.5, 0.7),
                     IN("#lk-err", "up", w("Tiến trình chết")), SHAKE("#lk-err", w("không bao giờ"))]),
        B("Cách đúng là một lệnh SET với NX và PX. NX: chỉ một người giữ. PX: tự hết hạn nếu tiến trình chết. Còn token là giá trị duy nhất, để biết ai là chủ khoá.",
          "SET key token NX PX ttl: một lệnh.",
          lambda w: [OUT(S("lk-bad", "lk-err"), "blur", 0, 0.5), IN("#lk-good", "blur", 0.6), IN("#lk-n1", "up", w("NX:")),
                     IN("#lk-n2", "up", w("PX:")), IN("#lk-n3", "up", w("Còn token"))]),
        B("Vì sao cần token? A làm quá lâu, khoá hết hạn, B lấy được khoá. A làm xong gọi DEL thẳng, và đã chạy: DEL xoá luôn khoá của B.",
          "DEL thẳng xoá luôn khoá của B.",
          lambda w: [OUT(S("lk-n1", "lk-n2", "lk-n3"), "blur", 0, 0.4), IN("#lk-a1", "up", w("A làm quá")),
                     IN("#lk-a2", "up", w("B lấy")), IN("#lk-a3", "up", w("A làm xong")), SHAKE("#lk-a3", w("xoá luôn"))]),
        B("Nên mở khoá bằng một script Lua: so token rồi mới xoá, trong một bước nguyên tử. A mở bằng token A ra không, B mở bằng token B ra một.",
          "Lua: so token rồi DEL, một bước. A → 0, B → 1.",
          lambda w: [OUT(S("lk-a1", "lk-a2", "lk-a3"), "blur", 0, 0.4), IN("#lk-lua", "blur", 0.5, 0.7),
                     IN("#lk-r1", "pop", w("A mở")), IN("#lk-r2", "pop", w("B mở"))]),
        B("Trong Spring người ta dùng Redisson. Flash sale mười món, một trăm người mua: không khoá thì ra một trăm đơn. Synchronized trên hai instance ra hai mươi đơn, vì khoá của JVM không thấy JVM khác. R Lock trong Redis ra đúng mười đơn.",
          "Không khoá 100 đơn · synchronized 2 instance 20 đơn · RLock 10 đơn.",
          lambda w: [OUT(S("lk-good", "lk-lua", "lk-r1", "lk-r2"), "blur", 0, 0.5), IN("#lk-f1", "up", w("không khoá")),
                     IN("#lk-f2", "up", w("Synchronized")), IN("#lk-f3", "up", w("R Lock"))]),
        B("Không truyền lease time thì watchdog gia hạn: thời hạn ba mươi giây, cứ khoảng mười giây lại đặt về ba mươi. Truyền lease time mười giây là tắt watchdog: tới giây thứ mười khoá đã mất dù việc chưa xong.",
          "Không leaseTime: watchdog gia hạn. Có leaseTime: tắt watchdog.",
          lambda w: [IN("#lk-w1", "up", w("watchdog")), PULSE("#lk-w1", w("cứ khoảng")), IN("#lk-w2", "up", w("Truyền lease")),
                     SHAKE("#lk-w2", w("khoá đã mất"))]),
        B("Nhưng nếu chỉ trừ một con số trong database, câu Update có điều kiện qty lớn hơn không là đủ: đúng mười đơn, trong khoảng mười hai mili giây.",
          "Chỉ trừ số trong DB: UPDATE có điều kiện là đủ.",
          lambda w: [OUT(S("lk-w1", "lk-w2"), "blur", 0, 0.4), IN("#lk-u1", "up", w("câu Update")), IN("#lk-u2", "pop", w("đúng mười"))]),
        B("Nhớ: thời hạn để không treo, cần token để không xoá nhầm. Khoá vẫn không tuyệt đối, nên thao tác cuối nên idempotent.",
          "Thời hạn để không treo, token để không xoá nhầm.",
          lambda w: [DIM(S("lk-eye", "lk-q", "lk-f1", "lk-f2", "lk-f3", "lk-u1", "lk-u2"), 0, 0.07),
                     TYPE("#lk-t1", 0.3, 0.05), IN("#lk-t2", "blur", w("cần token"))]),
    ]),
    # ------------------------------------------------------------ rate limit
    dict(id="rate-limit", world=(1920, 1080), hud="", cam="".join([
        head("rl", "Rate limit", "INCR và Sorted Set"),
        rule("rl-rule", "Tối đa N yêu cầu mỗi khoảng thời gian", "Nhiều server nên bộ đếm phải nằm chung ở Redis"),
        cbox("rl-fx", 90, 270, 860, "fixed window",
             "n = INCR rl:u1\n"
             "if n == 1: EXPIRE rl:u1 60\n"
             "if n > 5: từ chối", "violet", 32),
        tag("rl-f1", 1010, 290, 820, 100, "INCR → 1 2 3 4 5 6", "green", 36),
        tag("rl-f2", 1010, 420, 820, 100, "TTL ≈ 60 · 1 key mỗi người", "green", 34),
        bigerr("rl-burst", 90, 600, 1740, "✕ 5 yêu cầu cuối cửa sổ + 5 yêu cầu đầu cửa sổ sau = 10 trong vài giây", 34),
        cbox("rl-sw", 90, 270, 1740, "sliding window",
             "ZREMRANGEBYSCORE sw:u1 0 (now-10)\n"
             "if ZCARD sw:u1 < 3: ZADD sw:u1 now now-requestId\n"
             "else: từ chối", "violet", 32),
        titled("rl-z1", 90, 560, 300, 150, "1000", "✓ qua", "", "green", 38),
        titled("rl-z2", 450, 560, 300, 150, "1002", "✓ qua", "", "green", 38),
        titled("rl-z3", 810, 560, 300, 150, "1004", "✓ qua", "", "green", 38),
        titled("rl-z4", 1170, 560, 300, 150, "1005", "✕ chặn", "", "red", 38),
        titled("rl-z5", 1530, 560, 300, 150, "1011", "✓ qua", "", "green", 38),
        note("rl-zn", 90, 750, 1740, "giới hạn 3 yêu cầu mỗi 10 giây · mốc cũ trôi khỏi cửa sổ", "green", 32),
        tag("rl-m1", 90, 560, 1740, 110, "ZADD sw:u1 1000 1000 × 3 → ZCARD = 1: đếm thiếu 2", "red", 36),
        tag("rl-m2", 90, 700, 1740, 110, "member 1000-r1, 1000-r2, 1000-r3 → ZCARD = 3", "green", 36),
        el("rl-t1", 0, 400, 1920, None, letters("Gộp các bước vào Lua"), "take r"),
        el("rl-t2", 0, 540, 1920, None, "fixed window: rẻ, burst ở ranh giới · sliding: chính xác, tốn bộ nhớ", "take-sm r"),
    ]), beats=[
        B("Khoá cho đúng một tiến trình làm việc. Rate limit thì cho tối đa N yêu cầu mỗi khoảng thời gian. Nhiều server nên bộ đếm phải nằm chung ở Redis.",
          "Rate limit: tối đa N yêu cầu mỗi khoảng thời gian.",
          lambda w: [IN("#rl-eye", "blur"), TYPE("#rl-q", 0.2, 0.05), IN("#rl-rule", "up", w("Rate limit thì"))]),
        B("Cách rẻ nhất là fixed window: INCR một key, lần đầu thì đặt EXPIRE sáu mươi giây, quá năm thì từ chối. Đã chạy sáu yêu cầu: INCR ra một tới sáu, chỉ một key cho mỗi người.",
          "Fixed window: INCR + EXPIRE, một key mỗi người.",
          lambda w: [OUT("#rl-rule", "blur", 0, 0.4), *shrink("rl", 0), IN("#rl-fx", "blur", 0.5, 0.7),
                     IN("#rl-f1", "up", w("Đã chạy")), IN("#rl-f2", "up", w("chỉ một key"))]),
        B("Điểm yếu là burst ở ranh giới: năm yêu cầu cuối cửa sổ cộng năm yêu cầu đầu cửa sổ sau, là mười yêu cầu trong vài giây mà vẫn qua hết.",
          "Burst ở ranh giới: 10 yêu cầu trong vài giây vẫn qua.",
          lambda w: [IN("#rl-burst", "up", w("năm yêu cầu")), SHAKE("#rl-burst", w("mười yêu cầu"))]),
        B("Sliding window dùng Sorted Set, score là thời điểm. Mỗi yêu cầu: xoá các mốc đã quá cửa sổ, đếm, còn chỗ thì thêm. Giới hạn ba yêu cầu mỗi mười giây: mốc một nghìn, một nghìn lẻ hai, một nghìn lẻ bốn đều qua. Một nghìn lẻ năm bị chặn. Tới một nghìn không trăm mười một, mốc cũ đã trôi ra, lại qua.",
          "Sliding window: 1000, 1002, 1004 qua · 1005 chặn · 1011 qua.",
          lambda w: [OUT(S("rl-fx", "rl-f1", "rl-f2", "rl-burst"), "blur", 0, 0.5), IN("#rl-sw", "blur", 0.6, 0.7),
                     IN("#rl-z1", "up", w("mốc một nghìn")), IN("#rl-z2", "up", w("một nghìn lẻ hai")), IN("#rl-z3", "up", w("một nghìn lẻ bốn")),
                     IN("#rl-z4", "pop", w("Một nghìn lẻ năm")), SHAKE("#rl-z4", w("bị chặn")), IN("#rl-z5", "up", w("Tới một")),
                     IN("#rl-zn", "up", w("Một nghìn lẻ năm"))]),
        B("Bẫy hay bị hỏi: Sorted Set là tập hợp. Ba yêu cầu cùng mili giây mà member trùng nhau thì đếm ra một, thiếu hai. Member phải duy nhất, ví dụ thời điểm cộng id yêu cầu.",
          "Member trùng: ZCARD ra 1. Member phải duy nhất.",
          lambda w: [OUT(S("rl-z1", "rl-z2", "rl-z3", "rl-z4", "rl-z5", "rl-zn"), "blur", 0, 0.4), IN("#rl-m1", "up", w("Ba yêu cầu")),
                     SHAKE("#rl-m1", w("thiếu hai")), IN("#rl-m2", "up", w("Member phải"))]),
        B("Cuối cùng, xoá, đếm rồi thêm là ba bước rời. Hai yêu cầu cùng lúc có thể cùng thấy còn chỗ, nên hãy gộp chúng vào một script Lua.",
          "Đếm rồi thêm là check-then-act: gộp vào Lua.",
          lambda w: [DIM(S("rl-eye", "rl-q", "rl-sw", "rl-m1", "rl-m2"), 0, 0.07), TYPE("#rl-t1", 0.3, 0.05),
                     IN("#rl-t2", "blur", w("Hai yêu cầu"))]),
    ]),
    # ------------------------------------------------------------ atomic
    dict(id="atomic", world=(1920, 1080), hud="", cam="".join([
        head("at", "Nguyên tử", "MULTI, WATCH, Lua và pipelining"),
        rule("at-rule", "Một lệnh là nguyên tử. Nhiều lệnh thì sao?", "Bài toán: trừ kho khi stock chỉ còn 1"),
        cbox("at-mx", 90, 270, 900, "MULTI / EXEC",
             "SET stock 1\n"
             "MULTI\n"
             "DECR stock\n"
             "LPUSH stock x   # sai kiểu\n"
             "DECR stock\n"
             "EXEC", "violet", 32),
        tag("at-m1", 1060, 300, 770, 110, "EXEC → 0, WRONGTYPE, -1", "amber", 36),
        bigerr("at-m2", 1060, 460, 770, "✕ Không rollback:<br>stock = -1", 36),
        tag("at-w1", 90, 290, 1740, 100, "A: WATCH stock · GET stock → 1", "cyan", 34),
        tag("at-w2", 90, 410, 1740, 100, "B: SET stock 0", "amber", 34),
        tag("at-w3", 90, 530, 1740, 100, "A: MULTI · DECR stock · EXEC → nil", "cyan", 34),
        tag("at-w4", 90, 650, 1740, 100, "Giao dịch bị huỷ, stock giữ 0: đọc lại rồi thử lại", "green", 34),
        cbox("at-lua", 90, 270, 1100, "buy.lua",
             "local s = tonumber(redis.call('get', KEYS[1]))\n"
             "if s > 0 then\n"
             "  redis.call('decr', KEYS[1]) return 1\n"
             "else return 0 end", "violet", 30),
        tag("at-l1", 1250, 290, 580, 100, "người 1 → 1", "green", 36),
        tag("at-l2", 1250, 410, 580, 100, "người 2 → 0", "amber", 36),
        tag("at-l3", 1250, 530, 580, 100, "stock = 0", "green", 36),
        note("at-ln", 90, 660, 1740, "Script nặng chặn cả server: Redis xử lý một luồng", "red", 34),
        el("at-ph", 90, 270, 1740, None, "redis-benchmark · 100.000 SET · 1 client · loopback", "note left r", "font-size:32px"),
        el("at-pl1", 90, 360, 260, 56, "-P 1", "mono r", "font-size:36px;line-height:56px"),
        el("at-pl2", 90, 460, 260, 56, "-P 16", "mono r", "font-size:36px;line-height:56px"),
        el("at-pl3", 90, 560, 260, 56, "-P 100", "mono r", "font-size:36px;line-height:56px"),
        bar("at-b1", 300, 360, 24),
        bar("at-b2", 300, 460, 200),
        bar("at-b3", 300, 560, 1140),
        el("at-v1", 350, 360, 500, 56, "7.204 / giây", "mono r", "font-size:34px;line-height:56px"),
        el("at-v2", 530, 460, 500, 56, "91.075 / giây", "mono r", "font-size:34px;line-height:56px"),
        el("at-v3", 1470, 560, 400, 56, "552.486 / giây", "mono r", "font-size:34px;line-height:56px"),
        tag("at-px", 90, 680, 1740, 100, "≈ 77 lần · không nguyên tử · lệnh sau không dùng được kết quả lệnh trước", "amber", 32),
        el("at-t1", 0, 400, 1920, None, letters("Mỗi công cụ một việc"), "take r"),
        el("at-t2", 0, 540, 1920, None, "MULTI: liền nhau, không rollback · Lua: có điều kiện · pipeline: gom vòng mạng", "take-sm r", "font-size:36px"),
    ]), beats=[
        B("Một lệnh Redis là nguyên tử. Nhiều lệnh thì sao? Bài toán: trừ kho khi stock chỉ còn một.",
          "Nhiều lệnh thì nguyên tử đến đâu?",
          lambda w: [IN("#at-eye", "blur"), TYPE("#at-q", 0.2, 0.05), IN("#at-rule", "up", w("Bài toán"))]),
        B("Multi và Exec chạy một loạt lệnh liền nhau, nhưng không có rollback. Đã chạy: lệnh LPUSH sai kiểu báo lỗi, hai lệnh DECR vẫn chạy, stock thành âm một.",
          "MULTI: lệnh lỗi thì chỉ lệnh đó lỗi. stock = -1.",
          lambda w: [OUT("#at-rule", "blur", 0, 0.4), *shrink("at", 0), IN("#at-mx", "blur", 0.5, 0.7),
                     IN("#at-m1", "up", w("Đã chạy")), IN("#at-m2", "up", w("hai lệnh")), SHAKE("#at-m2", w("thành âm"))]),
        B("Watch thêm khoá lạc quan. A watch stock và đọc được một. B set stock về không. A chạy Multi, DECR, Exec, và Exec trả nil: giao dịch bị huỷ, stock giữ không, A đọc lại rồi thử lại.",
          "WATCH: có người sửa trước EXEC thì EXEC trả nil.",
          lambda w: [OUT(S("at-mx", "at-m1", "at-m2"), "blur", 0, 0.5), IN("#at-w1", "up", w("A watch")), IN("#at-w2", "up", w("B set")),
                     IN("#at-w3", "up", w("A chạy")), IN("#at-w4", "up", w("giao dịch bị"))]),
        B("Cần rẽ nhánh theo giá trị vừa đọc thì dùng Lua. Hai người cùng mua khi kho còn một: người thứ nhất nhận một, người thứ hai nhận không, stock về không và không bị âm. Nhưng script nặng sẽ chặn cả server, vì Redis xử lý một luồng.",
          "Lua: có điều kiện, chạy nguyên tử. Script nặng chặn cả server.",
          lambda w: [OUT(S("at-w1", "at-w2", "at-w3", "at-w4"), "blur", 0, 0.5), IN("#at-lua", "blur", 0.5, 0.7),
                     IN("#at-l1", "pop", w("người thứ nhất")), IN("#at-l2", "pop", w("người thứ hai")), IN("#at-l3", "pop", w("stock về")),
                     IN("#at-ln", "up", w("Nhưng script"))]),
        B("Pipelining giải bài toán khác: độ trễ mạng. Đã đo một trăm nghìn lệnh SET: gửi từng lệnh được bảy nghìn hai trăm lệnh mỗi giây. Gom lô mười sáu được chín mươi mốt nghìn. Lô một trăm được năm trăm năm mươi hai nghìn, gấp khoảng bảy mươi bảy lần.",
          "Pipeline: 7.204 → 552.486 SET/giây, gấp khoảng 77 lần.",
          lambda w: [OUT(S("at-lua", "at-l1", "at-l2", "at-l3", "at-ln"), "blur", 0, 0.5), IN("#at-ph", "up", w("Đã đo")),
                     IN(S("at-pl1", "at-b1", "at-v1"), "left", w("gửi từng")), IN(S("at-pl2", "at-b2", "at-v2"), "left", w("Gom lô")),
                     IN(S("at-pl3", "at-b3", "at-v3"), "left", w("Lô một trăm")), IN("#at-px", "up", w("gấp khoảng"))]),
        B("Nhưng pipeline không phải transaction: lệnh client khác vẫn chen vào được, và lệnh sau không dùng được kết quả lệnh trước. Mỗi công cụ một việc.",
          "Pipeline chỉ gom vòng mạng, không nguyên tử.",
          lambda w: [PULSE("#at-px", 0.3), DIM(S("at-eye", "at-q", "at-ph", "at-pl1", "at-pl2", "at-pl3", "at-b1", "at-b2", "at-b3", "at-v1", "at-v2", "at-v3", "at-px"), w("lệnh client"), 0.07),
                     TYPE("#at-t1", w("lệnh client") + 0.3, 0.05), IN("#at-t2", "blur", w("và lệnh sau"))]),
    ]),
    # ------------------------------------------------------------ eviction
    dict(id="eviction", world=(1920, 1080), hud="", cam="".join([
        head("ev", "TTL và eviction", "Khi Redis hết bộ nhớ"),
        rule("ev-rule", "TTL: khoá tự hết hạn · Eviction: xoá bớt khi đầy", "Chính sách eviction quyết định điều gì xảy ra khi chạm maxmemory"),
        tag("ev-set", 90, 270, 1740, 100, "maxmemory 8mb · ghi 100.000 khoá, mỗi khoá 100 byte", "violet", 36),
        card("ev-ca", 90, 410, 840, 130, "noeviction", "mặc định: từ chối ghi khi đầy", "amber", 44, 28),
        card("ev-cb", 990, 410, 840, 130, "allkeys-lru", "xoá khoá ít dùng gần đây nhất", "cyan", 44, 28),
        tag("ev-a1", 90, 570, 840, 100, "≈ 46.500 SET thành công", "green", 34),
        tag("ev-a2", 90, 690, 840, 100, "≈ 53.500 bị từ chối (OOM)", "red", 34),
        tag("ev-b1", 990, 570, 840, 100, "100.000 SET đều OK", "green", 34),
        tag("ev-b2", 990, 690, 840, 100, "≈ 54.800 khoá cũ bị xoá", "amber", 34),
        tag("ev-x1", 90, 270, 1740, 100, "SET s1 v PX 300 · sau 0,5 giây GET → nil", "cyan", 36),
        tag("ev-x2", 90, 400, 1740, 100, "xoá khi có người truy cập (lazy) và quét ngầm định kỳ", "cyan", 32),
        tag("ev-x3", 90, 530, 1740, 100, "volatile-lru: chỉ xoá khoá có TTL · allkeys-lfu: theo tần suất", "violet", 32),
        card("ev-i1", 90, 680, 840, 160, "Instance cache", "allkeys-lru", "green", 40, 32),
        card("ev-i2", 990, 680, 840, 160, "Instance dữ liệu", "noeviction: session, khoá, hàng đợi", "amber", 40, 28),
        el("ev-t1", 0, 400, 1920, None, letters("Cache thì LRU, dữ liệu thì không"), "take r", "font-size:68px"),
        el("ev-t2", 0, 540, 1920, None, "đừng để allkeys-lru xoá session, khoá hay hàng đợi", "take-sm r"),
    ]), beats=[
        B("Khoá, bộ đếm, cache đều nằm trong RAM, mà RAM có hạn. TTL cho khoá tự hết hạn, còn eviction xoá bớt khi chạm maxmemory.",
          "TTL tự hết hạn · eviction xoá bớt khi đầy.",
          lambda w: [IN("#ev-eye", "blur"), TYPE("#ev-q", 0.2, 0.05), IN("#ev-rule", "up", w("TTL cho"))]),
        B("Thử nghiệm: giới hạn tám megabyte, ghi một trăm nghìn khoá, mỗi khoá một trăm byte. So hai chính sách: noeviction là mặc định, và allkeys LRU.",
          "8 MB, 100.000 khoá: noeviction và allkeys-lru.",
          lambda w: [OUT("#ev-rule", "blur", 0, 0.4), *shrink("ev", 0), IN("#ev-set", "blur", 0.5), IN("#ev-ca", "up", w("noeviction")),
                     IN("#ev-cb", "up", w("allkeys"))]),
        B("Với noeviction, khoảng bốn mươi sáu nghìn năm trăm lệnh SET thành công. Khoảng năm mươi ba nghìn năm trăm lệnh bị từ chối với lỗi OOM. Không khoá nào bị xoá.",
          "noeviction: ≈ 53.500 lệnh bị từ chối, OOM.",
          lambda w: [IN("#ev-a1", "up", w("khoảng bốn")), IN("#ev-a2", "up", w("Khoảng năm")), SHAKE("#ev-a2", w("lỗi OOM"))]),
        B("Với allkeys LRU, cả một trăm nghìn lệnh đều OK. Redis tự xoá khoảng năm mươi tư nghìn tám trăm khoá cũ, khoá mới nhất vẫn còn. Đúng ý nghĩa của cache.",
          "allkeys-lru: mọi SET OK, ≈ 54.800 khoá cũ bị xoá.",
          lambda w: [IN("#ev-b1", "up", w("cả một")), IN("#ev-b2", "up", w("Redis tự")), PULSE("#ev-cb", w("Đúng ý"))]),
        B("Còn TTL: đặt khoá sống ba trăm mili giây, nửa giây sau đọc ra nil. Redis xoá khoá hết hạn khi có người truy cập, và quét ngầm định kỳ. Biến thể volatile LRU chỉ xoá khoá có TTL.",
          "TTL: PX 300, sau 0,5 giây GET → nil.",
          lambda w: [OUT(S("ev-set", "ev-ca", "ev-cb", "ev-a1", "ev-a2", "ev-b1", "ev-b2"), "blur", 0, 0.5), IN("#ev-x1", "up", w("đặt khoá")),
                     IN("#ev-x2", "up", w("Redis xoá")), IN("#ev-x3", "up", w("Biến thể"))]),
        B("Bẫy: dùng allkeys LRU cho Redis chứa session, khoá hay hàng đợi thì chúng có thể biến mất. Hãy tách hai instance: cache dùng LRU, dữ liệu cần giữ dùng noeviction.",
          "Tách instance: cache allkeys-lru, dữ liệu noeviction.",
          lambda w: [IN("#ev-i1", "up", w("dùng allkeys")), IN("#ev-i2", "up", w("hay hàng")),
                     DIM(S("ev-eye", "ev-q", "ev-x1", "ev-x2", "ev-x3", "ev-i1", "ev-i2"), w("Hãy tách"), 0.07),
                     TYPE("#ev-t1", w("Hãy tách") + 0.2, 0.04), IN("#ev-t2", "blur", w("cache dùng"))]),
    ]),
    # ------------------------------------------------------------ ha
    dict(id="ha", world=(1920, 1080), hud="", cam="".join([
        head("ha", "Lưu trữ và mở rộng", "RDB, AOF, Sentinel, Cluster"),
        rule("ha-rule", "Redis giữ dữ liệu trong RAM", "Process chết thì cái gì còn lại?"),
        card("ha-r", 90, 270, 840, 220, "RDB", "snapshot theo điều kiện save · gọn, nạp nhanh", "amber", 52, 30),
        card("ha-a", 990, 270, 840, 220, "AOF", "ghi từng lệnh ghi · everysec fsync mỗi giây", "cyan", 52, 30),
        tag("ha-r1", 90, 530, 840, 110, "save 3600 1000 · kill -9 sau 2 giây", "violet", 30),
        tag("ha-r2", 90, 670, 840, 110, "GET k → rỗng", "red", 38),
        tag("ha-a1", 990, 530, 840, 110, "everysec · kill -9 sau 2 giây", "violet", 30),
        tag("ha-a2", 990, 670, 840, 110, "GET k → v", "green", 38),
        titled("ha-m", 160, 300, 420, 160, "ghi", "master", "", "amber", 48),
        titled("ha-s1", 900, 260, 420, 130, "", "replica 1", "", "cyan", 40),
        titled("ha-s2", 900, 430, 420, 130, "", "replica 2", "", "cyan", 40),
        titled("ha-se", 1420, 300, 420, 160, "giám sát", "Sentinel", "", "violet", 44),
        note("ha-n1", 160, 620, 1680, "bất đồng bộ: master chết thì vài lệnh ghi cuối có thể mất", "red", 34),
        note("ha-n2", 160, 690, 1680, "Sentinel bầu replica lên thay master và báo địa chỉ mới cho client", "green", 34),
        tag("ha-c0", 90, 270, 1740, 100, "16384 hash slot · slot = CRC16(key) mod 16384", "violet", 38),
        tag("ha-c1", 90, 400, 1740, 100, "KEYSLOT user:1 → 10778 · user:2 → 6777", "cyan", 34),
        tag("ha-c2", 90, 520, 1740, 100, "MGET a b → CROSSSLOT", "red", 34),
        tag("ha-c3", 90, 640, 1740, 100, "{user:1}:profile và {user:1}:cart → cùng 10778", "green", 34),
        note("ha-c4", 90, 770, 1740, "tag quá chung như {app}: mọi key dồn về một node nóng", "red", 32),
        wires(arrow("ha-w1", [(585, 370), (895, 325)], "muted"), arrow("ha-w2", [(585, 390), (895, 495)], "muted")),
        el("ha-t1", 0, 400, 1920, None, letters("Đủ dùng trước, Cluster sau"), "take r"),
        el("ha-t2", 0, 540, 1920, None, "replica + Sentinel cho đa số · Cluster khi dữ liệu hay tải ghi vượt một node", "take-sm r", "font-size:36px"),
    ]), beats=[
        B("Redis giữ dữ liệu trong RAM. Vậy process chết thì cái gì còn lại? Có hai cách lưu xuống đĩa: RDB chụp snapshot theo điều kiện save, AOF ghi từng lệnh ghi vào file.",
          "RDB: snapshot · AOF: ghi từng lệnh.",
          lambda w: [IN("#ha-eye", "blur"), TYPE("#ha-q", 0.2, 0.05), IN("#ha-rule", "up", w("Vậy process")),
                     OUT("#ha-rule", "blur", w("Có hai"), 0.4), *shrink("ha", w("Có hai")), IN("#ha-r", "up", w("RDB chụp")), IN("#ha-a", "up", w("AOF ghi"))]),
        B("Đã chạy: chỉ bật RDB với save ba nghìn sáu trăm một nghìn, SET một khoá rồi hai giây sau giết process. Khởi động lại, khoá rỗng, vì chưa có snapshot nào. Bật AOF everysec, cùng thử nghiệm, khoá vẫn còn. Đổi lại, everysec có thể mất tối đa khoảng một giây.",
          "Chỉ RDB: mất khoá. AOF everysec: còn khoá, mất tối đa ≈ 1 giây.",
          lambda w: [IN("#ha-r1", "up", w("chỉ bật")), IN("#ha-r2", "pop", w("Khởi động")), SHAKE("#ha-r2", w("khoá rỗng")),
                     IN("#ha-a1", "up", w("Bật AOF")), IN("#ha-a2", "pop", w("khoá vẫn"))]),
        B("Để dự phòng thì có replication: replica sao chép từ master, nhưng bất đồng bộ, nên master chết thì vài lệnh ghi cuối có thể mất. Sentinel giám sát master, khi master chết thì bầu một replica lên thay.",
          "Replication bất đồng bộ · Sentinel tự động failover.",
          lambda w: [OUT(S("ha-r", "ha-a", "ha-r1", "ha-r2", "ha-a1", "ha-a2"), "blur", 0, 0.5), IN("#ha-m", "up", w("có replication")),
                     *ARROW("ha-w1", w("replica sao"), 0.5), *ARROW("ha-w2", w("replica sao") + 0.2, 0.5), IN("#ha-s1", "up", w("replica sao") + 0.4), IN("#ha-s2", "up", w("replica sao") + 0.6), IN("#ha-n1", "up", w("bất đồng bộ")),
                     IN("#ha-se", "up", w("Sentinel")), IN("#ha-n2", "up", w("Sentinel") + 0.8)]),
        B("Khi một node không đủ, Redis Cluster chia key thành mười sáu nghìn ba trăm tám mươi tư slot. Đã chạy: user một và user hai rơi vào hai slot khác nhau, nên MGET hai key khác slot báo lỗi CROSSSLOT.",
          "Cluster: 16384 slot. Lệnh nhiều key cần cùng slot.",
          lambda w: [OUT(S("ha-m", "ha-s1", "ha-s2", "ha-se", "ha-n1", "ha-n2") + ", " + AR("ha-w1", "ha-w2"), "blur", 0, 0.5), IN("#ha-c0", "up", w("Redis Cluster")),
                     IN("#ha-c1", "up", w("Đã chạy")), IN("#ha-c2", "up", w("nên MGET")), SHAKE("#ha-c2", w("CROSSSLOT"))]),
        B("Sửa bằng hash tag: phần trong ngoặc nhọn mới được băm, nên profile và cart của cùng user một nằm chung slot. Nhưng tag quá chung thì mọi key dồn về một node nóng.",
          "Hash tag {...} ép cùng slot. Tag quá chung: node nóng.",
          lambda w: [IN("#ha-c3", "up", w("Sửa bằng")), PULSE("#ha-c3", w("nằm chung")), IN("#ha-c4", "up", w("Nhưng tag"))]),
        B("Một node có replica và Sentinel là đủ cho đa số hệ thống. Chỉ lên Cluster khi dữ liệu hay tải ghi vượt một node.",
          "Replica + Sentinel cho đa số. Cluster khi vượt một node.",
          lambda w: [DIM(S("ha-eye", "ha-q", "ha-c0", "ha-c1", "ha-c2", "ha-c3", "ha-c4"), 0, 0.07), TYPE("#ha-t1", 0.3, 0.05),
                     IN("#ha-t2", "blur", w("Chỉ lên"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Redis Patterns"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 200 + i * 118, 1660, 100, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("Khoá", "SET NX PX + token · mở bằng Lua · RLock"),
                                      ("Rate limit", "INCR rẻ · Sorted Set chính xác · gộp Lua"),
                                      ("Nguyên tử", "MULTI không rollback · Lua có điều kiện"),
                                      ("Eviction", "cache: allkeys-lru · dữ liệu: noeviction"),
                                      ("Lưu trữ", "AOF everysec · Cluster 16384 slot")])],
        el("ou-tr", 0, 810, 1920, None, "Bẫy: DEL thẳng · member trùng · pipeline không nguyên tử · allkeys xoá session", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 915, 1920, None, "Mở bài học tương tác để làm quiz và thử từng lệnh", "cta r"),
    ]), beats=[
        B("Tóm lại. Khoá phân tán: SET NX PX kèm token, mở bằng Lua, nhiều instance thì dùng R Lock. Rate limit: INCR rẻ, Sorted Set chính xác, gộp vào Lua.",
          "Khoá phân tán và rate limit.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Khoá phân tán:")), IN("#ou-r1", "right", w("Rate limit:"))]),
        B("Multi không rollback, cần điều kiện thì dùng Lua. Cache dùng allkeys LRU, dữ liệu cần giữ dùng noeviction. Lưu trữ thì AOF everysec, mở rộng bằng Cluster.",
          "Nguyên tử, eviction và lưu trữ.",
          lambda w: [IN("#ou-r2", "right", w("Multi")), IN("#ou-r3", "right", w("Cache dùng")), IN("#ou-r4", "right", w("Lưu trữ"))]),
        B("Và nhớ các bẫy: DEL thẳng, member trùng, tưởng pipeline là nguyên tử, và để allkeys LRU xoá session. Mở bài học tương tác để làm quiz nhé.",
          "Nhớ các bẫy, rồi làm quiz.",
          lambda w: [IN("#ou-tr", "blur", w("DEL thẳng")), IN("#ou-cta", "blur", w("Mở bài học"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
