"""Redis data structures explainer: String/INCR, Hash and big keys, Sorted Set, Set vs HyperLogLog, Pub/Sub vs Stream, drill.

Every output comes from the lesson (web/src/data/lessons/redis-structures.ts), run on Redis 8.6.2:
4 clients x 2000 GET+SET -> 2781 instead of 8000, INCR -> 8000; SET k v EX 100 -> TTL 100;
HGET user:1 name -> An, HINCRBY user:1 age 1 -> 31;
big key: 2,000,000-field hash, DEL ~0.9 s with a 924 ms LATENCY event, UNLINK ~8 ms, MEMORY USAGE ~106.5 million bytes (~102 MiB);
ZADD lb 120 an 300 binh 210 chi 50 dung: top 3 binh 300, chi 210, an 120; ZREVRANK an -> 2; ZINCRBY 200 -> 320, an first;
10,000 users: Set ~535,590 bytes, HyperLogLog ~12,832 bytes (~40x smaller), PFCOUNT 10067 (~0.7% error); SINTER u2 u3, SUNION u1..u4;
PUBLISH with no listener -> 0; XLEN orders -> 2; XPENDING 1 then 0 after XACK; RPUSH -> 3, LPOP a then b, LLEN 1.
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


def ARW(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head (no travelling light dot: frames stay clean)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text):
    return f'<span class="mono big" style="font-size:42px">{label}</span><span style="font-size:34px">{esc(text)}</span>'


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
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


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
               f'<b style="font-size:56px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=44, ds=30):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def bar(id_, x, y, w, h, tone):
    return el(id_, x, y, w, h, "", "r", f"background:var(--{tone});border-radius:10px;transform-origin:0 50%")


def take(p, big, small):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(small), "take-sm r"))


STRUCTS = [("String", "bộ đếm nguyên tử"), ("Hash", "object nhiều field"), ("Sorted Set", "bảng xếp hạng"),
           ("Set", "đếm chính xác"), ("HyperLogLog", "đếm gần đúng"), ("Stream", "thông điệp có lưu")]

DRILL = [
    ("Đếm lượt xem bài viết, nhiều request cùng lúc", "String"),
    ("Hồ sơ người dùng, hay sửa từng trường", "Hash"),
    ("Hàng đợi việc đơn giản, vào trước ra trước", "List"),
    ("Bài viết đã thích: không trùng, kiểm tra nhanh", "Set"),
    ("Bảng xếp hạng, điểm cập nhật liên tục", "Sorted Set"),
    ("Hàng chục triệu người xem duy nhất, ít bộ nhớ", "HyperLogLog"),
    ("Đơn hàng cho nhiều worker, không mất, có xác nhận", "Stream"),
]
DY = lambda i: 250 + i * 92

# leaderboard slots (rank 0 at the top)
LY = lambda i: 290 + i * 120

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Redis · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Chọn đúng cấu trúc dữ liệu"), "h1 r", "font-size:100px"),
        *[card(f"hk-c{i}", 60 + i * 306, 420, 280, 280, n, d, "cyan", 34, 26) for i, (n, d) in enumerate(STRUCTS)],
        chip("hk-p1", 470, 800, "Lệnh chạy thật trên Redis 8", "green"),
        chip("hk-p2", 1160, 800, "Bẫy hay bị hỏi", "amber"),
        take("hk", "Mỗi bài toán một cấu trúc", "chọn theo thao tác cần có, không cần viết code ở ứng dụng"),
    ]), beats=[
        B("Người phỏng vấn hỏi: Redis chỉ là cache dạng key value? Câu trả lời là không.",
          "Redis chỉ là cache key-value? Không.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05)]),
        B("Redis có nhiều cấu trúc dữ liệu, mỗi cấu trúc có thao tác nguyên tử riêng: String, Hash, Sorted Set, Set, HyperLogLog và Stream.",
          "Mỗi cấu trúc có thao tác nguyên tử riêng.",
          lambda w: [IN("#hk-c0", "pop", w("String")), IN("#hk-c1", "pop", w("Hash")), IN("#hk-c2", "pop", w("Sorted Set")),
                     IN("#hk-c3", "pop", w("Set,") + 0.1), IN("#hk-c4", "pop", w("HyperLogLog")), IN("#hk-c5", "pop", w("Stream"))]),
        B("Mỗi phần có kết quả lệnh chạy thật trên Redis tám, và một cái bẫy hay bị hỏi.",
          "Kết quả chạy thật trên Redis 8, và bẫy hay bị hỏi.",
          lambda w: [IN("#hk-p1", "up", w("kết quả")), IN("#hk-p2", "pop", w("một cái bẫy"))]),
        B("Hãy chọn cấu trúc theo thao tác cần có. Chọn đúng thì không phải viết code ở ứng dụng.",
          "Chọn theo thao tác cần có.",
          lambda w: [OUT(S("hk-eye", "hk-q", *[f"hk-c{i}" for i in range(6)], "hk-p1", "hk-p2"), "blur", 0, 0.6),
                     TYPE("#hk-t1", 2.2, 0.03), IN("#hk-t2", "blur", 3.6)]),
    ]),
    # ------------------------------------------------------------ string + INCR
    dict(id="string-incr", world=(1920, 1080), hud="", cam="".join([
        head("si", "01 · String và INCR", "Bộ đếm nguyên tử"),
        rule("si-rule", "Nhiều request cùng tăng một bộ đếm", "Đếm lượt xem, số lần gọi API, sinh ID tăng dần"),
        cbox("si-bad", 90, 270, 900, "app: GET rồi SET", "v = GET cnt\nSET cnt v+1", "violet", 34),
        tag("si-a", 1080, 270, 750, 100, "Client A: GET cnt → 5", "cyan", 32),
        tag("si-b", 1080, 390, 750, 100, "Client B: GET cnt → 5", "cyan", 32),
        bigerr("si-race", 1080, 520, 750, "✕ cả hai SET cnt 6<br>mất một lần tăng", 32),
        titled("si-r1", 90, 560, 860, 230, "GET rồi SET · 4 client × 2000", "2781", "thay vì 8000", "red", 72),
        cbox("si-fix", 1000, 270, 830, "Redis: một lệnh", "INCR cnt\nINCRBY views 10", "violet", 34),
        titled("si-r2", 970, 560, 860, 230, "INCR · 4 client × 2000", "8000", "đúng, không cần khoá", "green", 72),
        tag("si-ex", 90, 820, 1740, 90, "SET k v EX 100  →  TTL k = 100 (giá trị và thời hạn trong một lệnh)", "amber", 30),
        take("si", "Đưa phép tính tới dữ liệu", "GET rồi SET là check-then-act · dùng INCR, HINCRBY, SETNX hoặc Lua"),
    ]), beats=[
        B("Kiểu cơ bản nhất của Redis là String. Bài toán đầu tiên: đếm lượt xem, khi rất nhiều request cùng tăng một bộ đếm.",
          "String: nhiều request cùng tăng một bộ đếm.",
          lambda w: [IN("#si-eye", "blur"), TYPE("#si-q", 0.2, 0.05), IN("#si-rule", "up", w("Bài toán"))]),
        B("Cách tự nhiên là đọc giá trị bằng GET, cộng một ở ứng dụng, rồi ghi lại bằng SET. Đó là hai bước tách rời.",
          "GET, cộng một ở ứng dụng, rồi SET: hai bước tách rời.",
          lambda w: [OUT("#si-rule", "blur", 0, 0.4), *shrink("si", 0), IN("#si-bad", "blur", 0.6, 0.7), PULSE("#si-bad", w("hai bước"))]),
        B("Client A đọc được năm. Trước khi A kịp ghi, client B cũng đọc năm. Cả hai cùng ghi sáu, và một lần tăng bị mất.",
          "A và B cùng đọc 5, cùng ghi 6: mất một lần tăng.",
          lambda w: [IN("#si-a", "right", w("Client A")), IN("#si-b", "right", w("client B")),
                     IN("#si-race", "up", w("Cả hai")), SHAKE("#si-race", w("một lần tăng"))]),
        B("Đã chạy: bốn client, mỗi client tăng hai nghìn lần. Đáng lẽ ra tám nghìn, nhưng kết quả chỉ là hai nghìn bảy trăm tám mươi mốt.",
          "Đã chạy: 4 client × 2000 lần ra 2781 thay vì 8000.",
          lambda w: [IN("#si-r1", "pop", w("kết quả")), SHAKE("#si-r1", w("kết quả") + 0.8)]),
        B("Cách đúng là lệnh INCR. Server tự tăng trong một lệnh. Redis xử lý lệnh tuần tự trên một luồng, nên không ai chen vào được. Đã chạy: đúng tám nghìn.",
          "INCR: server tăng trong một lệnh. Đã chạy: đúng 8000.",
          lambda w: [OUT(S("si-bad", "si-a", "si-b", "si-race"), "blur", 0, 0.5),
                     IN("#si-fix", "blur", 0.6, 0.7), PULSE("#si-fix", w("một luồng")), IN("#si-r2", "pop", w("Đã chạy"))]),
        B("Tương tự, SET với EX đặt giá trị và thời hạn trong một lệnh. Đã chạy: TTL ra một trăm.",
          "SET k v EX 100: giá trị và thời hạn trong một lệnh.",
          lambda w: [IN("#si-ex", "up", w("SET với"))]),
        B("Ý tưởng chung là đưa phép tính tới dữ liệu. Thấy mình viết GET rồi SET dựa trên giá trị vừa đọc, hãy tìm lệnh nguyên tử tương ứng, hoặc dùng Lua.",
          "Thấy GET rồi SET: tìm lệnh nguyên tử, hoặc dùng Lua.",
          lambda w: [DIM(S("si-eye", "si-q", "si-r1", "si-fix", "si-r2", "si-ex"), 0, 0.07),
                     TYPE("#si-t1", 0.4, 0.04), IN("#si-t2", "blur", w("Thấy mình"))]),
    ]),
    # ------------------------------------------------------------ hash + big key
    dict(id="hash", world=(1920, 1080), hud="", cam="".join([
        head("ha", "02 · Hash", "Một object nhiều field"),
        cbox("ha-json", 90, 270, 1100, "Cả object là một chuỗi JSON",
             "SET user:1 '{\"name\":\"An\",\"age\":30,\"city\":\"HN\"}'", "violet", 30),
        *[tag(f"ha-s{i}", 90 + i * 352, 520, 300, 90, t, "amber", 30)
          for i, t in enumerate(["GET", "parse", "sửa age", "serialize", "SET cả chuỗi"])],
        bigerr("ha-err", 90, 670, 1740, "✕ đổi một field phải đọc và ghi lại cả object<br>✕ hai client sửa hai field khác nhau có thể ghi đè nhau", 32),
        tag("ha-key", 90, 400, 380, 110, "user:1", "amber", 40),
        tag("ha-f0", 600, 280, 620, 100, "name  →  An", "cyan", 34),
        tag("ha-f1", 600, 400, 620, 100, "age  →  30", "cyan", 34),
        tag("ha-f1b", 600, 400, 620, 100, "age  →  31", "green", 34),
        tag("ha-f2", 600, 520, 620, 100, "city  →  HN", "cyan", 34),
        tag("ha-c1", 1300, 280, 530, 100, "HGET user:1 name → An", "green", 26),
        tag("ha-c2", 1300, 400, 530, 100, "HINCRBY user:1 age 1 → 31", "green", 26),
        note("ha-n", 600, 680, 1230, "Hash không lồng sâu: field là chuỗi hoặc số.\nObject nhiều tầng: RedisJSON hoặc tách key", "amber", 32),
        titled("ha-big", 90, 270, 700, 230, "hash bigA", "2.000.000 field", "MEMORY USAGE ≈ 102 MiB", "amber", 52),
        tag("ha-one", 870, 270, 960, 100, "một luồng chính xử lý mọi lệnh", "cyan", 32),
        tag("ha-slow", 870, 400, 960, 100, "một lệnh chậm → mọi client phải chờ", "red", 32),
        tag("ha-del", 90, 560, 380, 100, "DEL bigA", "red", 34),
        bar("ha-delb", 500, 575, 1080, 70, "red"),
        el("ha-delv", 1600, 578, 240, None, "924 ms", "note left r", "font-size:40px;font-weight:700"),
        tag("ha-unl", 90, 700, 380, 100, "UNLINK bigB", "green", 34),
        bar("ha-unlb", 500, 715, 16, 70, "green"),
        el("ha-unlv", 540, 718, 600, None, "≈ 8 ms · giải phóng ở luồng nền", "note left r", "font-size:36px;font-weight:700"),
        tag("ha-tool", 90, 830, 1740, 90, "Tìm big key: redis-cli --bigkeys · MEMORY USAGE <key>", "violet", 30),
        take("ha", "UNLINK · SCAN · chia nhỏ key", "đừng DEL hay HGETALL big key · duyệt bằng HSCAN, SSCAN, ZSCAN"),
        wires(arrow("ha-a0", [(475, 440), (595, 335)], "amber", head=True),
              arrow("ha-a1", [(475, 455), (595, 450)], "amber"),
              arrow("ha-a2", [(475, 470), (595, 565)], "amber")),
    ]), beats=[
        B("String lưu một giá trị. Còn hồ sơ người dùng có tên, tuổi, thành phố thì sao? Cách đầu tiên là lưu cả object thành một chuỗi JSON.",
          "Hồ sơ người dùng: lưu cả object thành một chuỗi JSON?",
          lambda w: [IN("#ha-eye", "blur"), TYPE("#ha-q", 0.2, 0.05), *shrink("ha", w("Cách đầu")), IN("#ha-json", "blur", w("Cách đầu") + 0.6, 0.7)]),
        B("Muốn đổi tuổi, phải đọc cả chuỗi, parse, sửa, serialize, rồi ghi lại toàn bộ. Hai client sửa hai field khác nhau còn có thể ghi đè nhau.",
          "Đổi một field: đọc và ghi lại cả object.",
          lambda w: [IN("#ha-s0", "up", w("phải đọc")), IN("#ha-s1", "up", w("parse")), IN("#ha-s2", "up", w("sửa,")),
                     IN("#ha-s3", "up", w("serialize")), IN("#ha-s4", "up", w("ghi lại")), IN("#ha-err", "up", w("Hai client")), SHAKE("#ha-err", w("ghi đè"))]),
        B("Hash lưu nhiều cặp field và giá trị dưới một key. Bạn đọc hay sửa từng field mà không đụng các field còn lại.",
          "Hash: nhiều cặp field và giá trị dưới một key.",
          lambda w: [OUT(S("ha-json", "ha-s0", "ha-s1", "ha-s2", "ha-s3", "ha-s4", "ha-err"), "blur", 0, 0.5),
                     IN("#ha-key", "pop", 0.6), *ARW("ha-a0", w("nhiều cặp")), *ARW("ha-a1", w("nhiều cặp") + 0.2), *ARW("ha-a2", w("nhiều cặp") + 0.4),
                     IN("#ha-f0", "right", w("nhiều cặp") + 0.3), IN("#ha-f1", "right", w("nhiều cặp") + 0.5), IN("#ha-f2", "right", w("nhiều cặp") + 0.7)]),
        B("Đã chạy: H GET lấy tên ra An. H INCR BY tăng tuổi lên ba mươi mốt, chỉ đụng field age, và nguyên tử.",
          "HGET ra An · HINCRBY age 1 ra 31, chỉ đụng field age.",
          lambda w: [IN("#ha-c1", "up", w("H GET")), PULSE("#ha-f0", w("ra An")),
                     IN("#ha-c2", "up", w("H INCR")), OUT("#ha-f1", "fade", w("ba mươi mốt"), 0.3), IN("#ha-f1b", "pop", w("ba mươi mốt"))]),
        B("Lưu ý, Hash không lồng sâu: mỗi field là chuỗi hoặc số. Object nhiều tầng thì dùng RedisJSON, hoặc tách key.",
          "Hash không lồng sâu: nhiều tầng thì RedisJSON hoặc tách key.",
          lambda w: [IN("#ha-n", "up", w("Hash không"))]),
        B("Nhưng khi một key chứa hàng triệu field, nó thành big key. Redis chạy lệnh trên một luồng chính, nên một lệnh chậm chặn mọi client khác.",
          "Big key: một luồng chính, một lệnh chậm chặn mọi client.",
          lambda w: [OUT(S("ha-key", "ha-f0", "ha-f1b", "ha-f2", "ha-c1", "ha-c2", "ha-n") + ", " + AR("ha-a0", "ha-a1", "ha-a2"), "blur", 0, 0.5),
                     IN("#ha-big", "pop", w("hàng triệu")), IN("#ha-one", "right", w("Redis chạy")), IN("#ha-slow", "right", w("nên một lệnh"))]),
        B("Đã chạy với hash hai triệu field. DEL giải phóng bộ nhớ ngay trên luồng chính: Redis ghi nhận một sự kiện chín trăm hai mươi bốn mili giây, không trả lời client nào.",
          "DEL hash 2.000.000 field: chặn Redis 924 ms.",
          lambda w: [IN("#ha-del", "up", w("DEL")), IN("#ha-delb", "left", w("DEL") + 0.3, 1.6), IN("#ha-delv", "pop", w("chín trăm")), SHAKE("#ha-delb", w("không trả lời"))]),
        B("UNLINK với cùng cấu trúc chỉ mất khoảng tám mili giây: key biến mất ngay, bộ nhớ được giải phóng ở luồng nền.",
          "UNLINK: khoảng 8 ms, giải phóng ở luồng nền.",
          lambda w: [IN("#ha-unl", "up", 0.1), IN("#ha-unlb", "left", 0.4, 0.4), IN("#ha-unlv", "up", w("khoảng tám"))]),
        B("Tìm big key bằng redis cli bigkeys, hoặc MEMORY USAGE. Đọc thì đừng H GET ALL cả key, hãy duyệt từng phần bằng H SCAN, và chia nhỏ key từ đầu.",
          "Đừng DEL hay HGETALL big key: UNLINK, *SCAN, chia nhỏ.",
          lambda w: [IN("#ha-tool", "up", 0.2),
                     DIM(S("ha-eye", "ha-q", "ha-big", "ha-one", "ha-slow", "ha-del", "ha-delb", "ha-delv", "ha-unl", "ha-unlb", "ha-unlv", "ha-tool"), w("Đọc thì"), 0.07),
                     TYPE("#ha-t1", w("Đọc thì") + 1.0, 0.04), IN("#ha-t2", "blur", w("hãy duyệt"))]),
    ]),
    # ------------------------------------------------------------ sorted set
    dict(id="zset", world=(1920, 1080), hud="", cam="".join([
        head("zs", "03 · Sorted Set", "Bảng xếp hạng"),
        cbox("zs-bad", 90, 270, 1000, "Leaderboard.java",
             "SELECT user, score FROM scores; // tải hết\n// sắp xếp trong Java, lấy top 3", "violet", 30),
        bigerr("zs-e1", 1150, 290, 680, "✕ tải hết rồi sắp xếp<br>mỗi lần hỏi", 32),
        bigerr("zs-e2", 1150, 470, 680, "✕ điểm đổi liên tục:<br>lại sắp xếp, lại ghi DB", 32),
        *[tag(f"zs-k{i}", 90, LY(i), 130, 100, str(i), "muted", 34) for i in range(4)],
        tag("zs-binh", 250, LY(0), 700, 100, "binh · 300", "cyan", 36),
        tag("zs-chi", 250, LY(1), 700, 100, "chi · 210", "cyan", 36),
        tag("zs-an", 250, LY(2), 700, 100, "an · 120", "amber", 36),
        tag("zs-dung", 250, LY(3), 700, 100, "dung · 50", "cyan", 36),
        tag("zs-an2", 250, LY(0), 700, 100, "an · 320", "green", 36),
        tag("zs-c1", 1040, LY(0), 790, 100, "ZADD lb 120 an 300 binh 210 chi 50 dung", "violet", 26),
        tag("zs-c2", 1040, LY(1), 790, 100, "ZREVRANGE lb 0 2 WITHSCORES → top 3", "green", 26),
        tag("zs-c3", 1040, LY(2), 790, 100, "ZREVRANK lb an → 2", "green", 26),
        tag("zs-c4", 1040, LY(3), 790, 100, "ZINCRBY lb 200 an → 320", "green", 26),
        note("zs-trap", 90, 790, 1740, "Bẫy: ZRANK, ZREVRANK tính hạng từ 0. Hiển thị cho người dùng thì cộng 1.", "amber", 32),
        take("zs", "Thứ tự luôn được giữ sẵn", "bảng xếp hạng · lịch hẹn giờ · cửa sổ trượt cho rate limit"),
    ]), beats=[
        B("Hash giữ một object, nhưng không có thứ tự giữa các object. Khi cần bảng xếp hạng, cách hay gặp là tải hết điểm từ database rồi sắp xếp trong Java.",
          "Bảng xếp hạng: tải hết rồi sắp xếp trong Java?",
          lambda w: [IN("#zs-eye", "blur"), TYPE("#zs-q", 0.2, 0.05), *shrink("zs", w("Khi cần")), IN("#zs-bad", "blur", w("cách hay gặp"), 0.7)]),
        B("Mỗi lần hỏi lại tải và sắp xếp. Hàng triệu người chơi, điểm đổi liên tục, thì việc đó lặp lại rất tốn.",
          "Sắp xếp lặp lại ở ứng dụng, rất tốn.",
          lambda w: [IN("#zs-e1", "up", 0.1), IN("#zs-e2", "up", w("Hàng triệu")), SHAKE("#zs-e2", w("rất tốn"))]),
        B("Sorted Set là tập hợp mà mỗi phần tử có một điểm số, và luôn được sắp theo điểm. Z ADD thêm bốn người chơi: An một trăm hai mươi, Bình ba trăm, Chi hai trăm mười, Dũng năm mươi.",
          "ZSET: mỗi phần tử có điểm, luôn sắp theo điểm.",
          lambda w: [OUT(S("zs-bad", "zs-e1", "zs-e2"), "blur", 0, 0.5), IN("#zs-c1", "up", w("Z ADD")),
                     IN("#zs-an", "right", w("An một")), IN("#zs-binh", "right", w("Bình")), IN("#zs-chi", "right", w("Chi hai")), IN("#zs-dung", "right", w("Dũng")),
                     IN(S("zs-k0", "zs-k1", "zs-k2", "zs-k3"), "fade", w("Dũng") + 0.6, 0.5, 0.1)]),
        B("Đã chạy: Z REV RANGE lấy top ba ra Bình ba trăm, Chi hai trăm mười, An một trăm hai mươi. Z REV RANK của An ra hai.",
          "Top 3: binh 300, chi 210, an 120. Hạng của an: 2.",
          lambda w: [IN("#zs-c2", "up", w("Z REV RANGE")), DIM("#zs-dung", w("lấy top"), 0.3),
                     PULSE("#zs-binh", w("Bình")), PULSE("#zs-chi", w("Chi")), PULSE("#zs-an", w("An một")),
                     IN("#zs-c3", "up", w("Z REV RANK")), PULSE("#zs-k2", w("ra hai"))]),
        B("Z INCR BY cộng cho An hai trăm, điểm thành ba trăm hai mươi, và An lên đầu bảng. Redis giữ sẵn thứ tự, không cần sắp xếp lại.",
          "ZINCRBY lb 200 an: 320, an lên đầu bảng.",
          lambda w: [IN("#zs-c4", "up", 0.1), TO("#zs-dung", {"opacity": 1}, 0, 0.3),
                     OUT("#zs-an", "fade", w("lên đầu"), 0.4), TO(S("zs-binh", "zs-chi"), {"y": 120}, w("lên đầu"), 0.7),
                     IN("#zs-an2", "pop", w("lên đầu") + 0.4)]),
        B("Bẫy nhỏ: hạng tính từ không, hiển thị cho người dùng thì cộng một. Sorted Set còn dùng cho lịch hẹn giờ, và cửa sổ trượt của rate limit.",
          "Hạng tính từ 0. Còn dùng cho hẹn giờ, rate limit.",
          lambda w: [IN("#zs-trap", "up", 0.2),
                     DIM(S("zs-eye", "zs-q", "zs-k0", "zs-k1", "zs-k2", "zs-k3", "zs-binh", "zs-chi", "zs-an2", "zs-dung", "zs-c1", "zs-c2", "zs-c3", "zs-c4", "zs-trap"), w("Sorted Set còn"), 0.07),
                     TYPE("#zs-t1", w("Sorted Set còn") + 0.2, 0.04), IN("#zs-t2", "blur", w("lịch hẹn"))]),
    ]),
    # ------------------------------------------------------------ set vs hyperloglog
    dict(id="counting", world=(1920, 1080), hud="", cam="".join([
        head("cn", "04 · Set và HyperLogLog", "Đếm người dùng duy nhất"),
        titled("cn-set", 90, 270, 820, 200, "Set", "SADD · SCARD", "phần tử không trùng, đếm chính xác", "cyan", 48),
        tag("cn-i", 90, 510, 820, 100, "SINTER v:mon v:tue → u2 u3", "green", 30),
        tag("cn-u", 90, 630, 820, 100, "SUNION v:mon v:tue → u1 u2 u3 u4", "green", 30),
        titled("cn-sm", 1000, 270, 830, 170, "Set · 10.000 người dùng", "535.590 byte", "", "red", 48),
        titled("cn-hq", 1000, 470, 830, 170, "HyperLogLog · 10.000 người dùng", "?", "", "amber", 48),
        titled("cn-hm", 1000, 470, 830, 170, "HyperLogLog · 10.000 người dùng", "12.832 byte", "PFCOUNT ra 10067 · sai số ≈ 0,7%", "green", 48),
        bar("cn-sb", 1000, 680, 830, 50, "red"),
        bar("cn-hb", 1000, 760, 20, 50, "green"),
        el("cn-x", 1045, 758, 780, None, "nhỏ hơn khoảng 40 lần", "note left r", "font-size:34px;font-weight:700"),
        note("cn-n", 90, 770, 820, "HyperLogLog: bộ nhớ cố định vài KB,\nchỉ cho số lượng, không liệt kê được", "amber", 30),
        take("cn", "Cần danh sách: Set · cần con số: HyperLogLog", "số tiền, số đơn hàng phải khớp tuyệt đối: không dùng xấp xỉ"),
    ]), beats=[
        B("Bài toán khác: đếm có bao nhiêu người dùng khác nhau. Set chứa các phần tử không trùng, nên đếm chính xác bằng S CARD.",
          "Set: phần tử không trùng, đếm chính xác.",
          lambda w: [IN("#cn-eye", "blur"), TYPE("#cn-q", 0.2, 0.05), *shrink("cn", w("Set chứa")), IN("#cn-set", "up", w("Set chứa") + 0.6)]),
        B("Set còn có phép giao và hợp. Đã chạy: S INTER ra u hai, u ba. S UNION ra từ u một tới u bốn.",
          "SINTER ra u2 u3 · SUNION ra u1 u2 u3 u4.",
          lambda w: [IN("#cn-i", "up", w("S INTER")), IN("#cn-u", "up", w("S UNION"))]),
        B("Nhưng thử đoán: đếm mười nghìn người dùng, Set tốn khoảng năm trăm ba mươi lăm nghìn byte. HyperLogLog tốn bao nhiêu?",
          "Đoán: 10.000 người dùng, Set tốn 535.590 byte. HyperLogLog?",
          lambda w: [IN("#cn-sm", "pop", w("Set tốn")), IN("#cn-sb", "left", w("Set tốn") + 0.4, 1.0), IN("#cn-hq", "pop", w("HyperLogLog tốn"))]),
        B("Đã chạy: P F COUNT ra mười nghìn không trăm sáu mươi bảy, sai số khoảng không phẩy bảy phần trăm. Và chỉ tốn khoảng mười hai nghìn tám trăm byte, nhỏ hơn Set khoảng bốn mươi lần.",
          "PFCOUNT ra 10067, chỉ tốn 12.832 byte: nhỏ hơn khoảng 40 lần.",
          lambda w: [OUT("#cn-hq", "fade", 0, 0.3), IN("#cn-hm", "pop", 0.2), IN("#cn-hb", "left", w("chỉ tốn"), 0.4), IN("#cn-x", "up", w("nhỏ hơn"))]),
        B("HyperLogLog dùng bộ nhớ cố định vài KB, không tăng theo số phần tử. Đổi lại kết quả là gần đúng, sai số khoảng một phần trăm, và không liệt kê được ai.",
          "Bộ nhớ cố định, đổi lại gần đúng và không liệt kê được.",
          lambda w: [IN("#cn-n", "up", 0.2), PULSE("#cn-hm", w("Đổi lại"))]),
        B("Chọn theo nhu cầu: cần danh sách hay phép giao thì Set. Chỉ cần con số lớn như số người xem duy nhất mỗi ngày thì HyperLogLog. Còn số tiền, số đơn hàng thì không bao giờ dùng xấp xỉ.",
          "Danh sách: Set · con số lớn: HyperLogLog · tiền: không xấp xỉ.",
          lambda w: [PULSE(S("cn-set"), w("cần danh sách")), PULSE("#cn-hm", w("Chỉ cần")),
                     DIM(S("cn-eye", "cn-q", "cn-set", "cn-i", "cn-u", "cn-sm", "cn-hm", "cn-sb", "cn-hb", "cn-x", "cn-n"), w("Còn số tiền") - 1.0, 0.07),
                     TYPE("#cn-t1", w("Còn số tiền") - 0.8, 0.03), IN("#cn-t2", "blur", w("Còn số tiền"))]),
    ]),
    # ------------------------------------------------------------ pub/sub vs stream
    dict(id="stream", world=(1920, 1080), hud="", cam="".join([
        head("sm", "05 · Pub/Sub và Stream", "Truyền thông điệp"),
        card("sm-ca", 90, 280, 860, 300, "Pub/Sub", "như phát thanh: ai đang nghe mới nhận, không lưu lại", "amber", 52, 32),
        card("sm-cb", 970, 280, 860, 300, "Stream", "nhật ký có lưu: consumer group, xác nhận, đọc lại", "green", 52, 32),
        tag("sm-pub", 90, 280, 600, 100, "PUBLISH news \"hello\"", "amber", 32),
        tag("sm-ch", 800, 280, 400, 100, "channel news", "violet", 32),
        tag("sm-no", 1310, 280, 520, 100, "không ai đang nghe", "red", 32),
        bigerr("sm-lost", 90, 420, 1740, "✕ PUBLISH trả về 0: thông điệp biến mất, không lưu lại", 32),
        tag("sm-e1", 90, 560, 300, 100, "id 1 · 100", "cyan", 32),
        tag("sm-e2", 410, 560, 300, 100, "id 2 · 250", "cyan", 32),
        tag("sm-len", 1360, 560, 470, 100, "XLEN orders → 2", "green", 30),
        tag("sm-g", 800, 560, 480, 100, "group workers · w1", "violet", 30),
        tag("sm-p1", 800, 700, 480, 100, "XPENDING → 1", "amber", 30),
        tag("sm-p0", 1360, 700, 470, 100, "XACK → XPENDING 0", "green", 30),
        note("sm-die", 90, 710, 640, "worker chết giữa chừng:\nvẫn pending, xử lý lại", "green", 30),
        tag("sm-lp", 90, 280, 800, 100, "RPUSH jobs a b c → 3", "cyan", 32),
        tag("sm-lo", 920, 280, 910, 100, "LPOP → a, rồi b · LLEN → 1", "green", 32),
        bigerr("sm-lx", 90, 420, 1740, "✕ List không có xác nhận: worker lấy ra rồi chết là mất việc", 32),
        take("sm", "Không được mất: Stream hoặc Kafka", "Pub/Sub chỉ khi mất một thông điệp cũng không sao"),
        wires(arrow("sm-a1", [(695, 330), (795, 330)], "amber"), arrow("sm-a2", [(1205, 330), (1305, 330)], "red", True),
              arrow("sm-a3", [(715, 610), (795, 610)], "violet")),
    ]), beats=[
        B("Các cấu trúc trước lưu dữ liệu. Còn khi cần gửi đơn hàng từ service sang worker, Redis có hai cách: Pub Sub và Stream.",
          "Gửi đơn hàng cho worker: Pub/Sub hay Stream?",
          lambda w: [IN("#sm-eye", "blur"), TYPE("#sm-q", 0.2, 0.05), *shrink("sm", w("Redis có")),
                     IN("#sm-ca", "up", w("Pub Sub")), IN("#sm-cb", "up", w("và Stream"))]),
        B("Pub Sub như phát thanh: ai đang nghe mới nhận được, không lưu lại gì. Đã chạy: PUBLISH khi chưa có ai nghe trả về không, và thông điệp biến mất.",
          "Pub/Sub: PUBLISH ra 0, thông điệp biến mất.",
          lambda w: [OUT(S("sm-ca", "sm-cb"), "blur", 0, 0.5), IN("#sm-pub", "right", 0.6), *ARW("sm-a1", w("ai đang")), IN("#sm-ch", "up", w("ai đang") + 0.4),
                     *ARW("sm-a2", w("Đã chạy")), IN("#sm-no", "pop", w("chưa có ai")), IN("#sm-lost", "up", w("trả về")), SHAKE("#sm-lost", w("biến mất"))]),
        B("Stream là nhật ký có lưu. X ADD hai đơn hàng, X LEN ra hai. Worker đến sau vẫn đọc được.",
          "Stream: XADD lưu lại, XLEN orders ra 2.",
          lambda w: [DIM(S("sm-pub", "sm-ch", "sm-no", "sm-lost") + ", " + AR("sm-a1", "sm-a2"), 0, 0.2),
                     IN("#sm-e1", "up", w("X ADD")), IN("#sm-e2", "up", w("X ADD") + 0.5), IN("#sm-len", "pop", w("X LEN"))]),
        B("Consumer group chia việc cho các worker. Sau X READ GROUP, X PENDING ra một thông điệp chưa xác nhận. Sau X ACK thì còn không. Worker chết giữa chừng thì thông điệp vẫn pending để xử lý lại.",
          "XREADGROUP: XPENDING 1 · XACK: còn 0.",
          lambda w: [*ARW("sm-a3", 0.2), IN("#sm-g", "right", 0.4), IN("#sm-p1", "up", w("X PENDING")), IN("#sm-p0", "up", w("Sau X ACK")),
                     IN("#sm-die", "up", w("Worker chết"))]),
        B("Hàng đợi đơn giản hơn thì dùng List: R PUSH thêm vào cuối, L POP lấy từ đầu, vào trước ra trước. Nhưng List không có xác nhận, worker lấy ra rồi chết là mất việc.",
          "List: RPUSH, LPOP. Không có xác nhận.",
          lambda w: [OUT(S("sm-pub", "sm-ch", "sm-no", "sm-lost") + ", " + AR("sm-a1", "sm-a2"), "blur", 0, 0.4),
                     DIM(S("sm-e1", "sm-e2", "sm-len", "sm-g", "sm-p1", "sm-p0", "sm-die") + ", " + AR("sm-a3"), 0, 0.2),
                     IN("#sm-lp", "up", w("R PUSH")), IN("#sm-lo", "up", w("L POP")), IN("#sm-lx", "up", w("Nhưng List")), SHAKE("#sm-lx", w("mất việc"))]),
        B("Cần độ bền cao, nhiều partition, replay lớn thì dùng Kafka. Nhớ: thông điệp không được mất thì dùng Stream hoặc Kafka. Pub Sub chỉ hợp khi mất một thông điệp cũng không sao.",
          "Không được mất: Stream hoặc Kafka.",
          lambda w: [DIM(S("sm-eye", "sm-q", "sm-lp", "sm-lo", "sm-lx", "sm-e1", "sm-e2", "sm-len", "sm-g", "sm-p1", "sm-p0", "sm-die") + ", " + AR("sm-a3"), 0, 0.07),
                     TYPE("#sm-t1", w("Nhớ:"), 0.04), IN("#sm-t2", "blur", w("Pub Sub chỉ"))]),
    ]),
    # ------------------------------------------------------------ drill
    dict(id="chon-cau-truc", world=(1920, 1080), hud="", cam="".join([
        head("cc", "06 · Bài tập", "Bài toán này dùng cấu trúc nào?"),
        *[box(f"cc-s{i}", 110, DY(i), 1080, 78, f'<span style="font-size:30px">{esc(t)}</span>', "cyan", "card") for i, (t, _) in enumerate(DRILL)],
        *[tag(f"cc-p{i}", 1330, DY(i), 480, 78, p, "green", 32) for i, (_, p) in enumerate(DRILL)],
        wires(*[arrow(f"cc-a{i}", [(1200, DY(i) + 39), (1318, DY(i) + 39)], "green") for i in range(7)]),
        take("cc", "Nhìn thao tác cần có", "tăng nguyên tử · theo field · FIFO · không trùng · xếp hạng · đếm xấp xỉ · có xác nhận"),
    ]), beats=[
        B("Giờ thử chọn cấu trúc. Mỗi dòng là một bài toán, hãy đoán trước khi đáp án hiện ra.",
          "Bài tập: mỗi bài toán dùng cấu trúc nào?",
          lambda w: [IN("#cc-eye", "blur"), TYPE("#cc-q", 0.2, 0.05), *shrink("cc", w("Mỗi dòng"))]),
        B("Đếm lượt xem, nhiều request cùng lúc: String với INCR. Hồ sơ người dùng hay sửa từng trường: Hash. Hàng đợi vào trước ra trước: List.",
          "String · Hash · List.",
          lambda w: [IN("#cc-s0", "right", 0), *ARW("cc-a0", w("String") - 0.3, 0.3), IN("#cc-p0", "pop", w("String")),
                     IN("#cc-s1", "right", w("Hồ sơ")), *ARW("cc-a1", w("Hash") - 0.3, 0.3), IN("#cc-p1", "pop", w("Hash")),
                     IN("#cc-s2", "right", w("Hàng đợi")), *ARW("cc-a2", w("List") - 0.3, 0.3), IN("#cc-p2", "pop", w("List"))]),
        B("Bài viết đã thích, không trùng, kiểm tra thành viên nhanh: Set. Bảng xếp hạng cập nhật điểm liên tục: Sorted Set.",
          "Set · Sorted Set.",
          lambda w: [IN("#cc-s3", "right", 0), *ARW("cc-a3", w("Set.") - 0.3, 0.3), IN("#cc-p3", "pop", w("Set.")),
                     IN("#cc-s4", "right", w("Bảng xếp")), *ARW("cc-a4", w("Sorted Set") - 0.3, 0.3), IN("#cc-p4", "pop", w("Sorted Set"))]),
        B("Hàng chục triệu người xem duy nhất với bộ nhớ nhỏ: HyperLogLog. Đơn hàng cho nhiều worker, không được mất, có xác nhận: Stream.",
          "HyperLogLog · Stream.",
          lambda w: [IN("#cc-s5", "right", 0), *ARW("cc-a5", w("HyperLogLog") - 0.3, 0.3), IN("#cc-p5", "pop", w("HyperLogLog")),
                     IN("#cc-s6", "right", w("Đơn hàng")), *ARW("cc-a6", w("Stream") - 0.3, 0.3), IN("#cc-p6", "pop", w("Stream"))]),
        B("Bí quyết là nhìn thao tác cần có: tăng nguyên tử, theo field, vào trước ra trước, không trùng, xếp hạng, đếm xấp xỉ, hay nhật ký có xác nhận.",
          "Nhìn thao tác cần có, rồi chọn cấu trúc.",
          lambda w: [DIM(S("cc-eye", "cc-q", *[f"cc-s{i}" for i in range(7)], *[f"cc-p{i}" for i in range(7)]) + ", " + AR(*[f"cc-a{i}" for i in range(7)]), 0, 0.07),
                     TYPE("#cc-t1", 0.4, 0.04), IN("#cc-t2", "blur", w("tăng nguyên tử"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 190 + i * 105, 1660, 90, row(k, t), "cyan", "row")
          for i, (k, t) in enumerate([("String", "INCR nguyên tử, đừng GET rồi SET"),
                                      ("Hash", "sửa từng field · big key: UNLINK, SCAN"),
                                      ("Sorted Set", "xếp hạng, thứ tự giữ sẵn, hạng từ 0"),
                                      ("Set", "đếm chính xác, giao và hợp"),
                                      ("HyperLogLog", "đếm gần đúng, bộ nhớ cố định"),
                                      ("Stream", "có lưu, consumer group, XACK")])],
        el("ou-tr", 0, 830, 1920, None, "Pub/Sub không lưu · không xấp xỉ khi cần số chính xác", "take-sm r", "font-size:34px"),
        el("ou-cta", 0, 905, 1920, None, "Mở bài học tương tác để làm quiz và thử từng lệnh", "cta r"),
    ]), beats=[
        B("Tóm lại. String: dùng INCR nguyên tử, đừng GET rồi SET. Hash: sửa từng field, và cẩn thận big key. Sorted Set: xếp hạng, thứ tự luôn giữ sẵn.",
          "String · Hash · Sorted Set.",
          lambda w: [TYPE("#ou-h", 0, 0.05), IN("#ou-r0", "right", w("String:")), IN("#ou-r1", "right", w("Hash:")), IN("#ou-r2", "right", w("Sorted Set:"))]),
        B("Set: đếm chính xác, có giao và hợp. HyperLogLog: đếm gần đúng với bộ nhớ cố định. Stream: thông điệp có lưu và có xác nhận.",
          "Set · HyperLogLog · Stream.",
          lambda w: [IN("#ou-r3", "right", w("Set:")), IN("#ou-r4", "right", w("HyperLogLog:")), IN("#ou-r5", "right", w("Stream:"))]),
        B("Nhớ hai bẫy: Pub Sub không lưu thông điệp, và đừng dùng xấp xỉ khi cần số chính xác. Mở bài học tương tác để làm quiz và thử từng lệnh nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-tr", "blur", w("Pub Sub")), IN("#ou-cta", "blur", w("Mở bài học"))]),
    ]),
]

fit_to_audio(SCENES, __file__)
