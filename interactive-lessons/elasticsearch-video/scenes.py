"""Elasticsearch explainer: inverted index and analyzer, mapping, query, shards, sync, when not to use it.

Every Elasticsearch response comes from the lesson (web/src/data/lessons/elasticsearch.ts), run on Elasticsearch 8.15.3:
standard analyzer on "Điện thoại Sạc Nhanh" -> điện, thoại, sạc, nhanh; with lowercase + asciifolding -> dien, thoai, sac, nhanh;
term name "Điện thoại Sạc Nhanh" -> 0, term name.raw -> 1, term status ACTIVE -> 2, active -> 0; sort on text -> 400 fielddata;
match "dien thoai" -> docs 1 and 3 (score 0.94); bool must sac + filter ACTIVE + price lte 1000000 -> doc 2; filter only -> score 0.0;
from 10000 size 10 -> result window too large [10010]; refresh_interval 30s: search 0, GET found, after _refresh search 1;
external version 5 then 3 -> 409 version_conflict; _reindex total 5, _aliases swap acknowledged; v2 without mapping: term dien -> 0.
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


def AW(id_, d, dur=0.5):
    """Draw an arrow and pop its head; no travelling light dot (clean frames)."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text, ls=40, ts=34):
    return f'<span class="mono big" style="font-size:{ls}px">{esc(label)}</span><span style="font-size:{ts}px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=30):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=30):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


def bigerr(id_, x, y, w, html_text, size=30):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=32, align="left"):
    cls = f"note {tone} left r" if align == "left" else f"note {tone} r"
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), cls, f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:54px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:34px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=40, ds=28):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc).replace(chr(10), "<br>")}</span>', tone, "card")


def take(p, main, sub):
    return el(f"{p}-t1", 0, 400, 1920, None, letters(main), "take r") + el(f"{p}-t2", 0, 540, 1920, None, esc(sub), "take-sm r")


PARTS = [("Analyzer", "inverted index, bỏ dấu"), ("Mapping", "text hay keyword"), ("Query", "match, term, bool"),
         ("Shard", "replica, refresh"), ("Đồng bộ", "outbox, CDC, alias"), ("Khi nào không", "và Spring Data")]

TOK_STD = ["điện", "thoại", "sạc", "nhanh"]
TOK_FOLD = ["dien", "thoai", "sac", "nhanh"]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Elasticsearch · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Search không ra?"), "h1 r", "font-size:120px"),
        tag("hk-in", 330, 440, 560, 120, "gõ: sac nhanh", "amber", 40),
        bigerr("hk-out", 1030, 440, 560, "✕ 0 kết quả<br>dù có sản phẩm \"Sạc Nhanh\"", 32),
        *[card(f"hk-c{i}", 70 + i * 300, 400, 280, 280, n, d, "cyan", 34, 26) for i, (n, d) in enumerate(PARTS)],
        chip("hk-p1", 640, 760, "Request chạy thật trên Elasticsearch 8.15", "green"),
        el("hk-t1", 0, 400, 1920, None, "Bản sao để tìm kiếm", "take r", "color:#fff"), el("hk-t2", 0, 540, 1920, None, "database vẫn là nguồn sự thật", "take-sm r"),
        wires(arrow("hk-a1", [(900, 500), (1020, 500)], "muted")),
    ]), beats=[
        B("Người dùng gõ sac nhanh, không dấu. Sản phẩm Sạc Nhanh có trong kho, nhưng search ra không kết quả. Lỗi nằm ở đâu?",
          "Gõ không dấu, search ra 0 kết quả. Lỗi ở đâu?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.06), IN("#hk-in", "up", w("Người dùng") + 0.6),
                     *AW("hk-a1", w("nhưng search")), IN("#hk-out", "pop", w("ra không")), SHAKE("#hk-out", w("ra không") + 0.6)]),
        B("Bài này đi qua sáu phần: analyzer, mapping, query, shard, đồng bộ từ database, và khi nào không nên dùng Elasticsearch.",
          "Sáu phần, từ inverted index tới đồng bộ dữ liệu.",
          lambda w: [OUT(S("hk-in", "hk-out") + ", " + AR("hk-a1"), "blur", 0, 0.4),
                     IN("#hk-c0", "pop", w("analyzer")), IN("#hk-c1", "pop", w("mapping")), IN("#hk-c2", "pop", w("query")),
                     IN("#hk-c3", "pop", w("shard")), IN("#hk-c4", "pop", w("đồng bộ")), IN("#hk-c5", "pop", w("khi nào"))]),
        B("Mọi request trong bài đều đã chạy thật trên Elasticsearch tám chấm mười lăm.",
          "Mọi request đều chạy thật trên Elasticsearch 8.15.",
          lambda w: [IN("#hk-p1", "up", w("chạy thật"))]),
        B("Và nhớ một ý xuyên suốt: Elasticsearch là bản sao để tìm kiếm, database vẫn là nguồn sự thật.",
          "Elasticsearch là bản sao để tìm kiếm.",
          lambda w: [DIM(S("hk-eye", "hk-q", "hk-p1", *[f"hk-c{i}" for i in range(6)]), 0, 0.07),
                     IN("#hk-t1", "blur", 0.2, 0.8), IN("#hk-t2", "blur", w("database vẫn"))]),
    ]),
    # ------------------------------------------------------------ inverted index + analyzer
    dict(id="inverted-index", world=(1920, 1080), hud="", cam="".join([
        head("ii", "Phần 1 · Inverted index và analyzer", "Mục lục cuối sách"),
        rule("ii-rule", "Từ → danh sách tài liệu chứa từ đó", "posting list, kèm vị trí và số lần xuất hiện để xếp hạng"),
        tag("ii-d1", 110, 300, 700, 100, "1 · Điện thoại Sạc Nhanh", "cyan", 32),
        tag("ii-d2", 110, 430, 700, 100, "2 · Sạc dự phòng 20000mAh", "cyan", 32),
        tag("ii-d3", 110, 560, 700, 100, "3 · Ốp lưng điện thoại", "cyan", 32),
        note("ii-lb", 840, 380, 220, "inverted", "green", 30, "center"),
        box("ii-p1", 1110, 300, 700, 100, row("dien", "→ 1, 3"), "green", "row"),
        box("ii-p2", 1110, 430, 700, 100, row("thoai", "→ 1, 3"), "green", "row"),
        box("ii-p3", 1110, 560, 700, 100, row("sac", "→ 1, 2"), "green", "row"),
        note("ii-n1", 110, 720, 1700, "Từ nào vào mục lục do analyzer quyết định", "green", 34, "center"),
        card("ii-s1", 120, 270, 520, 200, "Character filter", "sửa chuỗi gốc, ví dụ bỏ thẻ HTML", "violet", 38, 28),
        card("ii-s2", 700, 270, 520, 200, "Tokenizer", "đúng một cái, cắt thành token", "violet", 38, 28),
        card("ii-s3", 1280, 270, 520, 200, "Token filter", "lowercase, asciifolding", "violet", 38, 28),
        note("ii-in", 120, 500, 1680, "Đầu vào: \"Điện thoại Sạc Nhanh\"", "amber", 34, "center"),
        tag("ii-r1", 120, 580, 520, 110, "standard", "cyan", 32),
        *[tag(f"ii-a{i}", 700 + i * 285, 580, 260, 110, t, "cyan", 36) for i, t in enumerate(TOK_STD)],
        tag("ii-r2", 120, 730, 520, 110, "+ asciifolding", "green", 32),
        *[tag(f"ii-b{i}", 700 + i * 285, 730, 260, 110, t, "green", 36) for i, t in enumerate(TOK_FOLD)],
        take("ii", "Gọi _analyze, so token hai phía", "đổi analyzer: index mới rồi reindex"),
        wires(arrow("ii-w1", [(820, 480), (1100, 480)], "green"),
              arrow("ii-w2", [(645, 370), (695, 370)], "violet"), arrow("ii-w3", [(1225, 370), (1275, 370)], "violet")),
    ]), beats=[
        B("Câu LIKE có phần trăm ở hai đầu phải đọc mọi dòng, và không xếp hạng. Full text search dùng inverted index, giống mục lục cuối sách.",
          "Full-text search dùng inverted index, giống mục lục cuối sách.",
          lambda w: [IN("#ii-eye", "blur"), TYPE("#ii-q", 0.2, 0.05), IN("#ii-rule", "up", w("Full text"))]),
        B("Thay vì lưu tài liệu rồi tới nội dung, nó lưu từng từ, trỏ tới danh sách tài liệu chứa từ đó, gọi là posting list.",
          "Lưu từ → danh sách tài liệu (posting list).",
          lambda w: [OUT("#ii-rule", "blur", 0, 0.4), *shrink("ii", 0),
                     IN("#ii-d1", "left", 0.6), IN("#ii-d2", "left", 0.8), IN("#ii-d3", "left", 1.0),
                     *AW("ii-w1", w("nó lưu"), 0.6), IN("#ii-lb", "fade", w("nó lưu") + 0.3),
                     IN("#ii-p1", "up", w("trỏ tới")), IN("#ii-p2", "up", w("trỏ tới") + 0.3), IN("#ii-p3", "up", w("trỏ tới") + 0.6),
                     PULSE("#ii-p3", w("posting list"))]),
        B("Từ nào vào mục lục do analyzer quyết định. Analyzer là dây chuyền ba bước: character filter sửa chuỗi gốc, đúng một tokenizer cắt thành token, rồi các token filter biến đổi từng token.",
          "Analyzer: character filter → tokenizer → token filter.",
          lambda w: [IN("#ii-n1", "up", 0.2),
                     OUT(S("ii-d1", "ii-d2", "ii-d3", "ii-lb", "ii-p1", "ii-p2", "ii-p3", "ii-n1") + ", " + AR("ii-w1"), "blur", w("Analyzer là"), 0.5),
                     IN("#ii-s1", "up", w("character filter")), *AW("ii-w2", w("đúng một") - 0.4, 0.4),
                     IN("#ii-s2", "up", w("đúng một")), *AW("ii-w3", w("rồi các") - 0.4, 0.4), IN("#ii-s3", "up", w("rồi các"))]),
        B("Analyzer standard tách tiếng Việt theo âm tiết và hạ chữ thường, nhưng vẫn giữ dấu. Index lưu sạc có dấu, người dùng gõ sac thì không khớp.",
          "standard: tách theo âm tiết, chữ thường, vẫn giữ dấu.",
          lambda w: [IN("#ii-in", "fade", 0), IN("#ii-r1", "left", w("standard")),
                     IN(S("ii-a0", "ii-a1", "ii-a2", "ii-a3"), "pop", w("tách tiếng"), 0.5, 0.25), PULSE("#ii-a2", w("Index lưu"))]),
        B("Thêm token filter asciifolding: chữ đ thành d, dấu bị bỏ. Analyzer chạy hai lần, lúc index và lúc search, nên hai đầu phải dùng cùng analyzer thì mới khớp.",
          "+ asciifolding: dien, thoai, sac, nhanh. Cùng analyzer ở hai đầu.",
          lambda w: [IN("#ii-r2", "left", 0.3), IN(S("ii-b0", "ii-b1", "ii-b2", "ii-b3"), "pop", w("chữ đ"), 0.5, 0.25),
                     PULSE("#ii-s3", w("Thêm token")), PULSE("#ii-b2", w("hai đầu"))]),
        B("Khi search không ra, gọi API analyze với đúng analyzer của field, rồi so token hai phía. Và nhớ, đổi analyzer không áp dụng ngược cho dữ liệu cũ: phải tạo index mới rồi reindex.",
          "Debug: gọi _analyze, so token. Đổi analyzer = index mới + reindex.",
          lambda w: [DIM(S("ii-eye", "ii-q", "ii-s1", "ii-s2", "ii-s3", "ii-in", "ii-r1", "ii-r2",
                           *[f"ii-a{i}" for i in range(4)], *[f"ii-b{i}" for i in range(4)]) + ", " + AR("ii-w2", "ii-w3"), 0, 0.07),
                     TYPE("#ii-t1", w("so token"), 0.04), IN("#ii-t2", "blur", w("Và nhớ"))]),
    ]),
    # ------------------------------------------------------------ mapping
    dict(id="mapping", world=(1920, 1080), hud="", cam="".join([
        head("mp", "Phần 2 · Mapping", "text hay keyword?"),
        card("mp-c1", 110, 300, 540, 240, "Document", "một tài liệu JSON có _id, giống một dòng", "cyan"),
        card("mp-c2", 690, 300, 540, 240, "Index", "tập document cùng cấu trúc, giống một bảng", "cyan"),
        card("mp-c3", 1270, 300, 540, 240, "Mapping", "kiểu và cách index từng field, giống schema", "violet"),
        card("mp-tx", 110, 300, 830, 300, "text", "qua analyzer, sinh nhiều token · dùng để tìm toàn văn", "cyan", 52, 32),
        card("mp-kw", 980, 300, 830, 300, "keyword", "nguyên văn, một token · lọc, sort, aggregation", "green", 52, 32),
        cbox("mp-code", 110, 260, 1000, "PUT /products",
             '"name":   { "type": "text", "analyzer": "vn_fold",\n'
             '            "fields": { "raw": { "type": "keyword" } } },\n'
             '"status": { "type": "keyword" },\n'
             '"price":  { "type": "long" }', "violet", 28),
        note("mp-m1", 1160, 290, 650, "name: match, tìm toàn văn", "green", 32),
        note("mp-m2", 1160, 370, 650, "name.raw: sort, term chính xác", "green", 32),
        note("mp-m3", 1160, 450, 650, "status: filter, aggregation", "green", 32),
        box("mp-q1", 110, 560, 1290, 80, row("term name", "\"Điện thoại Sạc Nhanh\"", 30, 30), "red", "row"),
        tag("mp-a1", 1430, 560, 380, 80, "0 kết quả", "red", 32),
        box("mp-q2", 110, 655, 1290, 80, row("term name.raw", "\"Điện thoại Sạc Nhanh\"", 30, 30), "green", "row"),
        tag("mp-a2", 1430, 655, 380, 80, "1 kết quả", "green", 32),
        box("mp-q3", 110, 750, 1290, 80, row("term status", "\"ACTIVE\"", 30, 30), "green", "row"),
        tag("mp-a3", 1430, 750, 380, 80, "2 kết quả", "green", 32),
        box("mp-q4", 110, 845, 1290, 80, row("term status", "\"active\"", 30, 30), "red", "row"),
        tag("mp-a4", 1430, 845, 380, 80, "0 kết quả", "red", 32),
        tag("mp-sort", 110, 300, 700, 110, "sort: name asc", "amber", 36),
        bigerr("mp-err", 880, 290, 930, "✕ 400 · Fielddata is disabled on [name].<br>Please use a keyword field instead.", 28),
        tag("mp-agg", 110, 480, 1700, 110, "aggs terms status → ACTIVE 4 · HIDDEN 1", "green", 34),
        tag("mp-dyn", 110, 300, 820, 110, "{ \"price\": \"100\" }", "amber", 36),
        bigerr("mp-dyn2", 1000, 300, 810, "✕ price thành text + price.keyword<br>range so chuỗi, không so số", 30),
        note("mp-dyn3", 110, 480, 1700, "Kiểu của field đã có không đổi được: muốn đổi thì index mới + reindex", "amber", 34, "center"),
        take("mp", "text để tìm · keyword để lọc", "sort và aggregation dùng keyword · khai mapping tường minh"),
    ]), beats=[
        B("Analyzer sinh token, nhưng field nào qua analyzer, field nào không? Đó là việc của mapping. Document giống một dòng, index giống một bảng, còn mapping giống schema.",
          "Document ≈ dòng · Index ≈ bảng · Mapping ≈ schema.",
          lambda w: [IN("#mp-eye", "blur"), TYPE("#mp-q", 0.2, 0.05), *shrink("mp", w("Đó là")),
                     IN("#mp-c1", "up", w("Document")), IN("#mp-c2", "up", w("index giống")), IN("#mp-c3", "up", w("còn mapping"))]),
        B("Hai kiểu chuỗi quan trọng nhất. Text qua analyzer, sinh nhiều token, dùng để tìm toàn văn. Keyword không qua analyzer, cả chuỗi là một token nguyên văn, dùng để lọc chính xác, sort và aggregation.",
          "text: tìm toàn văn · keyword: lọc, sort, aggregation.",
          lambda w: [OUT(S("mp-c1", "mp-c2", "mp-c3"), "blur", 0, 0.4), IN("#mp-tx", "up", w("Text qua")), IN("#mp-kw", "up", w("Keyword không"))]),
        B("Multi field cho một giá trị cả hai vai: name là text để tìm, name chấm raw là keyword để sort và lọc chính xác.",
          "Multi-field: name (text) + name.raw (keyword).",
          lambda w: [OUT(S("mp-tx", "mp-kw"), "blur", 0, 0.4), IN("#mp-code", "blur", 0.4, 0.7),
                     IN("#mp-m1", "left", w("name là")), IN("#mp-m2", "left", w("name chấm")), IN("#mp-m3", "left", w("sort và") + 0.6)]),
        B("Chạy thật: term trên field text với nguyên cụm Điện thoại Sạc Nhanh cho không kết quả, vì index chỉ có token đã chuẩn hoá. Term trên name chấm raw cho một kết quả.",
          "term trên text: 0 · trên name.raw: 1.",
          lambda w: [IN("#mp-q1", "left", 0.3), IN("#mp-a1", "pop", w("cho không")), SHAKE("#mp-a1", w("cho không") + 0.4),
                     IN("#mp-q2", "left", w("Term trên name")), IN("#mp-a2", "pop", w("một kết quả"))]),
        B("Keyword còn phân biệt hoa thường: status ACTIVE viết hoa ra hai kết quả, viết thường ra không.",
          "keyword phân biệt hoa thường: ACTIVE 2, active 0.",
          lambda w: [IN("#mp-q3", "left", w("status ACTIVE")), IN("#mp-a3", "pop", w("ra hai")),
                     IN("#mp-q4", "left", w("viết thường")), IN("#mp-a4", "pop", w("ra không"))]),
        B("Sort trên field text thì lỗi bốn trăm: fielddata bị tắt, Elasticsearch khuyên dùng field keyword. Aggregation trên status là keyword thì chạy bình thường.",
          "Sort trên text: lỗi 400. Sort và aggregation dùng keyword.",
          lambda w: [OUT(S("mp-code", "mp-m1", "mp-m2", "mp-m3", "mp-q1", "mp-q2", "mp-q3", "mp-q4", "mp-a1", "mp-a2", "mp-a3", "mp-a4"), "blur", 0, 0.5),
                     IN("#mp-sort", "up", 0.6), IN("#mp-err", "pop", w("lỗi bốn")), SHAKE("#mp-err", w("lỗi bốn") + 0.5),
                     IN("#mp-agg", "up", w("Aggregation"))]),
        B("Đừng để dynamic mapping đoán kiểu: client gửi giá dạng chuỗi thì price thành text, lọc range thành so chuỗi. Và kiểu của field đã có thì không đổi được, muốn đổi phải tạo index mới rồi reindex.",
          "Dynamic mapping đoán sai kiểu. Field đã có không đổi kiểu được.",
          lambda w: [OUT(S("mp-sort", "mp-err", "mp-agg"), "blur", 0, 0.5), IN("#mp-dyn", "up", w("client gửi")),
                     IN("#mp-dyn2", "pop", w("price thành")), IN("#mp-dyn3", "up", w("Và kiểu"))]),
        B("Tóm lại: text để tìm, keyword để lọc, sort và đếm. Cần cả hai thì khai multi field ngay từ đầu.",
          "text để tìm · keyword để lọc, sort, đếm.",
          lambda w: [DIM(S("mp-eye", "mp-q", "mp-dyn", "mp-dyn2", "mp-dyn3"), 0, 0.07),
                     TYPE("#mp-t1", 0.3, 0.04), IN("#mp-t2", "blur", w("Cần cả"))]),
    ]),
    # ------------------------------------------------------------ query
    dict(id="query", world=(1920, 1080), hud="", cam="".join([
        head("qr", "Phần 3 · Query", "match, term, bool và phân trang"),
        rule("qr-rule", "Query có qua analyzer hay không?", "match: có, dùng cho text · term: không, dùng cho giá trị chính xác"),
        cbox("qr-m", 110, 270, 830, "match", '{ "match": { "name": "dien thoai" } }', "cyan", 28),
        cbox("qr-t", 980, 270, 830, "term", '{ "term": { "name": "Điện thoại Sạc Nhanh" } }', "violet", 28),
        tag("qr-mr", 110, 440, 830, 100, "✓ tài liệu 1 và 3 · _score 0.94", "green", 32),
        tag("qr-tr", 980, 440, 830, 100, "✕ 0 kết quả", "red", 32),
        note("qr-mn", 110, 580, 830, "qua analyzer vn_fold\ngõ không dấu vẫn khớp", "green", 32),
        note("qr-tn", 980, 580, 830, "không phân tích, so nguyên văn\ndùng cho keyword, số, ngày, id", "green", 32),
        box("qr-b1", 110, 270, 1700, 95, row("must", "bắt buộc khớp, có tính điểm"), "cyan", "row"),
        box("qr-b2", 110, 380, 1700, 95, row("filter", "bắt buộc khớp, không tính điểm"), "green", "row"),
        box("qr-b3", 110, 490, 1700, 95, row("should", "khớp thì cộng điểm"), "cyan", "row"),
        box("qr-b4", 110, 600, 1700, 95, row("must_not", "loại trừ, không tính điểm"), "cyan", "row"),
        cbox("qr-code", 110, 260, 1100, "bool query",
             '"must":   [ { "match": { "name": "sac" } } ],\n'
             '"filter": [ { "term":  { "status": "ACTIVE" } },\n'
             '            { "range": { "price": { "lte": 1000000 } } } ]', "violet", 28),
        tag("qr-r1", 1250, 270, 560, 100, "tài liệu 2", "green", 34),
        note("qr-r1n", 1250, 390, 560, "_score chỉ từ phần must", "green", 30),
        tag("qr-r2", 1250, 470, 560, 100, "chỉ filter → _score 0.0", "amber", 30),
        card("qr-w1", 110, 600, 540, 170, "Không tính điểm", "bỏ phần tính BM25", "green", 34, 28),
        card("qr-w2", 690, 600, 540, 170, "Có thể được cache", "bitset theo segment", "green", 34, 28),
        card("qr-w3", 1270, 600, 540, 170, "Không méo xếp hạng", "điểm chỉ phản ánh khớp chữ", "green", 34, 28),
        card("qr-z1", 110, 790, 540, 140, "Term frequency", "lặp nhiều điểm cao, có bão hoà", "cyan", 30, 26),
        card("qr-z2", 690, 790, 540, 140, "IDF", "từ hiếm đáng giá hơn", "cyan", 30, 26),
        card("qr-z3", 1270, 790, 540, 140, "Độ dài field", "field ngắn điểm cao hơn", "cyan", 30, 26),
        tag("qr-p0", 110, 280, 700, 100, "from: 10000, size: 10", "amber", 34),
        bigerr("qr-perr", 880, 270, 930, "✕ Result window is too large,<br>from + size must be ≤ [10000] but was [10010]", 28),
        note("qr-pn", 110, 450, 1700, "Mỗi shard trả top from + size về node điều phối, gộp lại rồi bỏ gần hết", "amber", 32, "center"),
        cbox("qr-sa", 110, 560, 1700, "search_after",
             '"sort": [ { "price": "desc" }, { "name.raw": "asc" } ],\n'
             '"search_after": [600000, "Sạc dự phòng 20000mAh"]', "violet", 28),
        take("qr", "Chữ người dùng gõ vào must", "điều kiện có / không vào filter · trang sâu dùng search_after"),
    ]), beats=[
        B("Hai query cơ bản nhất khác nhau đúng một điểm: query có qua analyzer hay không.",
          "match và term khác nhau ở một điểm: có qua analyzer không.",
          lambda w: [IN("#qr-eye", "blur"), TYPE("#qr-q", 0.2, 0.05), IN("#qr-rule", "up", w("query có"))]),
        B("Match chạy chuỗi tìm qua analyzer của field: gõ dien thoai không dấu vẫn ra tài liệu một và ba, có điểm xếp hạng. Term không phân tích, tìm đúng nguyên văn, nên nguyên cụm tên trên field text ra không kết quả.",
          "match: ra tài liệu 1 và 3 · term trên text: 0.",
          lambda w: [OUT("#qr-rule", "blur", 0, 0.4), *shrink("qr", 0), IN("#qr-m", "blur", 0.5, 0.6), IN("#qr-mr", "pop", w("vẫn ra")),
                     IN("#qr-mn", "up", w("có điểm")), IN("#qr-t", "blur", w("Term không"), 0.6), IN("#qr-tr", "pop", w("ra không")),
                     SHAKE("#qr-tr", w("ra không") + 0.4), IN("#qr-tn", "up", w("tìm đúng"))]),
        B("Query thật thường kết hợp bằng bool. Must bắt buộc và tính điểm. Filter bắt buộc nhưng không tính điểm. Should khớp thì cộng điểm. Must not để loại trừ.",
          "bool: must · filter · should · must_not.",
          lambda w: [OUT(S("qr-m", "qr-t", "qr-mr", "qr-tr", "qr-mn", "qr-tn"), "blur", 0, 0.5),
                     IN("#qr-b1", "left", w("Must bắt")), IN("#qr-b2", "left", w("Filter bắt")), PULSE("#qr-b2", w("không tính")),
                     IN("#qr-b3", "left", w("Should")), IN("#qr-b4", "left", w("Must not"))]),
        B("Chạy thật: tìm sac trong must, lọc ACTIVE và giá tới một triệu trong filter. Kết quả là tài liệu hai, điểm chỉ đến từ phần must. Nếu chỉ có filter, điểm bằng không.",
          "must: match sac · filter: ACTIVE, giá ≤ 1 triệu → tài liệu 2.",
          lambda w: [OUT(S("qr-b1", "qr-b2", "qr-b3", "qr-b4"), "blur", 0, 0.5), IN("#qr-code", "blur", 0.5, 0.7),
                     IN("#qr-r1", "pop", w("Kết quả")), IN("#qr-r1n", "up", w("điểm chỉ")), IN("#qr-r2", "up", w("Nếu chỉ"))]),
        B("Điều kiện có hoặc không nên nằm trong filter: không tính điểm, có thể được cache, và không làm méo xếp hạng. Điểm mặc định tính bằng BM25: từ lặp nhiều thì cao hơn nhưng bão hoà, từ hiếm đáng giá hơn, field ngắn điểm cao hơn.",
          "filter: không tính điểm, được cache, không méo xếp hạng. BM25: TF, IDF, độ dài.",
          lambda w: [IN("#qr-w1", "up", w("không tính")), IN("#qr-w2", "up", w("có thể")), IN("#qr-w3", "up", w("và không")),
                     IN("#qr-z1", "up", w("từ lặp")), IN("#qr-z2", "up", w("từ hiếm")), IN("#qr-z3", "up", w("field ngắn"))]),
        B("Phân trang sâu thì from cộng size bị chặn ở mười nghìn, vì mỗi shard phải trả top from cộng size về node điều phối để gộp. Trang sâu dùng search after: gửi giá trị sort của tài liệu cuối trang trước, và sort phải duy nhất.",
          "from + size bị chặn ở 10.000 → dùng search_after, sort duy nhất.",
          lambda w: [OUT(S("qr-code", "qr-r1", "qr-r1n", "qr-r2", "qr-w1", "qr-w2", "qr-w3", "qr-z1", "qr-z2", "qr-z3"), "blur", 0, 0.5),
                     IN("#qr-p0", "up", 0.5), IN("#qr-perr", "pop", w("bị chặn")), SHAKE("#qr-perr", w("bị chặn") + 0.5),
                     IN("#qr-pn", "up", w("vì mỗi")), IN("#qr-sa", "blur", w("Trang sâu"), 0.7), PULSE("#qr-sa", w("sort phải"))]),
        B("Nhớ quy tắc: chữ người dùng gõ vào must, mọi điều kiện có hoặc không vào filter.",
          "Chữ người dùng gõ → must · điều kiện → filter.",
          lambda w: [DIM(S("qr-eye", "qr-q", "qr-p0", "qr-perr", "qr-pn", "qr-sa"), 0, 0.07),
                     TYPE("#qr-t1", 0.3, 0.04), IN("#qr-t2", "blur", w("mọi điều"))]),
    ]),
    # ------------------------------------------------------------ shards
    dict(id="shards", world=(1920, 1080), hud="", cam="".join([
        head("sh", "Phần 4 · Shard, replica, refresh", "Ghi xong chưa chắc tìm thấy"),
        box("sh-na", 110, 270, 820, 330, '<b style="font-size:34px;align-self:center">Node A</b>', "muted", "panel"),
        box("sh-nb", 990, 270, 820, 330, '<b style="font-size:34px;align-self:center">Node B</b>', "muted", "panel"),
        tag("sh-p0", 160, 360, 340, 180, "Primary 0", "cyan", 34),
        tag("sh-r1", 540, 360, 340, 180, "Replica 1", "violet", 34),
        tag("sh-p1", 1040, 360, 340, 180, "Primary 1", "cyan", 34),
        tag("sh-r0", 1420, 360, 340, 180, "Replica 0", "violet", 34),
        note("sh-n1", 110, 630, 1700, "Replica không bao giờ nằm cùng node với primary của nó", "green", 32, "center"),
        tag("sh-f", 110, 700, 1700, 110, "shard = hash(_routing) % số primary shard", "amber", 38),
        bigerr("sh-err", 110, 840, 1700, "✕ Can't update non dynamic settings [[index.number_of_shards]] for open indices", 28),
        box("sh-s1", 110, 270, 1100, 95, row("PUT", "_doc/10 \"Tai nghe\""), "cyan", "row"),
        box("sh-s2", 110, 380, 1100, 95, row("search", "\"tai nghe\""), "red", "row"),
        tag("sh-s2r", 1250, 380, 560, 95, "0 kết quả", "red", 34),
        box("sh-s3", 110, 490, 1100, 95, row("GET", "_doc/10"), "green", "row"),
        tag("sh-s3r", 1250, 490, 560, 95, "found: true", "green", 34),
        box("sh-s4", 110, 600, 1100, 95, row("POST", "_refresh"), "amber", "row"),
        box("sh-s5", 110, 710, 1100, 95, row("search", "\"tai nghe\""), "green", "row"),
        tag("sh-s5r", 1250, 710, 560, 95, "1 kết quả", "green", 34),
        note("sh-s0", 1250, 270, 560, "refresh_interval: 30s", "amber", 32),
        card("sh-k1", 110, 300, 830, 300, "Refresh", "làm dữ liệu mới tìm được · mặc định 1 giây", "cyan", 50, 32),
        card("sh-k2", 980, 300, 830, 300, "Translog", "ghi trước khi trả lời · lo độ bền", "green", 50, 32),
        note("sh-k3", 110, 660, 1700, "Cần thấy ngay: ?refresh=wait_for cho đúng request đó, đừng _refresh sau mỗi lần ghi", "amber", 32, "center"),
        take("sh", "Số primary chốt khi tạo index", "replica đổi tự do · search thấy dữ liệu sau refresh"),
    ]), beats=[
        B("Một index được chia thành nhiều primary shard, mỗi shard là một index Lucene độc lập nằm trên một node. Mỗi primary có replica, là bản sao nằm trên node khác.",
          "Primary shard chia dữ liệu · replica là bản sao trên node khác.",
          lambda w: [IN("#sh-eye", "blur"), TYPE("#sh-q", 0.2, 0.05), *shrink("sh", w("Một index")),
                     IN(S("sh-na", "sh-nb"), "fade", w("mỗi shard"), 0.5), IN("#sh-p0", "pop", w("độc lập")), IN("#sh-p1", "pop", w("độc lập") + 0.3),
                     IN("#sh-r0", "pop", w("Mỗi primary có")), IN("#sh-r1", "pop", w("Mỗi primary có") + 0.3), IN("#sh-n1", "up", w("nằm trên node khác"))]),
        B("Tài liệu vào shard nào được tính bằng hash của routing, mặc định là id, chia lấy dư cho số primary shard. Đổi số chia thì tài liệu cũ nằm sai chỗ, nên số primary chốt khi tạo index. Replica thì đổi lúc nào cũng được.",
          "Routing = hash chia lấy dư → số primary chốt khi tạo index.",
          lambda w: [IN("#sh-f", "up", 0.3), PULSE("#sh-f", w("chia lấy")), IN("#sh-err", "pop", w("Đổi số")), SHAKE("#sh-err", w("Đổi số") + 0.5),
                     PULSE(S("sh-r0", "sh-r1"), w("Replica thì"))]),
        B("Near real time: ghi xong chưa search thấy ngay. Chạy thật với refresh interval ba mươi giây: ghi tai nghe, search ra không kết quả, nhưng GET theo id thì thấy. Gọi refresh xong, search ra một.",
          "Trước refresh: search 0, GET by id thấy. Sau refresh: search 1.",
          lambda w: [OUT(S("sh-na", "sh-nb", "sh-p0", "sh-p1", "sh-r0", "sh-r1", "sh-n1", "sh-f", "sh-err"), "blur", 0, 0.5),
                     IN("#sh-s0", "fade", w("Chạy thật")), IN("#sh-s1", "left", w("ghi tai")),
                     IN("#sh-s2", "left", w("search ra không")), IN("#sh-s2r", "pop", w("ra không") + 0.3),
                     IN("#sh-s3", "left", w("nhưng GET")), IN("#sh-s3r", "pop", w("thì thấy")),
                     IN("#sh-s4", "left", w("Gọi refresh")), IN("#sh-s5", "left", w("search ra một")), IN("#sh-s5r", "pop", w("ra một"))]),
        B("Mặc định refresh interval là một giây. Độ bền thì không phụ thuộc refresh: mỗi thao tác ghi vào translog trước khi trả lời thành công. Refresh lo tìm thấy, translog lo độ bền.",
          "Refresh lo tìm thấy (mặc định 1 giây) · translog lo độ bền.",
          lambda w: [OUT(S("sh-s0", "sh-s1", "sh-s2", "sh-s2r", "sh-s3", "sh-s3r", "sh-s4", "sh-s5", "sh-s5r"), "blur", 0, 0.5),
                     IN("#sh-k1", "up", 0.6), IN("#sh-k2", "up", w("Độ bền")), PULSE("#sh-k1", w("Refresh lo")), PULSE("#sh-k2", w("translog lo"))]),
        B("Vì vậy đừng viết luồng ghi xong search ngay. Thật sự cần thì dùng refresh bằng wait for cho đúng request đó. Và đừng tạo thật nhiều shard nhỏ cho chắc, mỗi shard đều tốn heap.",
          "Cần thấy ngay: refresh=wait_for. Đừng tạo quá nhiều shard nhỏ.",
          lambda w: [IN("#sh-k3", "up", w("Thật sự")),
                     DIM(S("sh-eye", "sh-q", "sh-k1", "sh-k2", "sh-k3"), w("Và đừng"), 0.07),
                     TYPE("#sh-t1", w("Và đừng") + 0.3, 0.04), IN("#sh-t2", "blur", w("mỗi shard"))]),
    ]),
    # ------------------------------------------------------------ sync
    dict(id="sync", world=(1920, 1080), hud="", cam="".join([
        head("sy", "Phần 5 · Đồng bộ database sang Elasticsearch", "Giữ hai bên khớp nhau"),
        tag("sy-svc", 110, 420, 420, 130, "Service", "amber", 38),
        tag("sy-db", 760, 300, 420, 120, "Database", "cyan", 36),
        tag("sy-es", 760, 560, 420, 120, "Elasticsearch", "violet", 36),
        bigerr("sy-e1", 1250, 280, 560, "✕ Ghi ES lỗi sau commit:<br>ES thiếu tài liệu", 28),
        bigerr("sy-e2", 1250, 450, 560, "✕ Rollback sau khi ghi ES:<br>ES có tài liệu ma", 28),
        bigerr("sy-e3", 1250, 620, 560, "✕ Hai cập nhật song song:<br>thứ tự có thể đảo", 28),
        card("sy-f1", 70, 290, 410, 230, "Service", "UPDATE product + INSERT outbox, 1 transaction", "amber", 34, 26),
        card("sy-f2", 540, 290, 380, 230, "Relay / Debezium", "đọc outbox hoặc WAL", "cyan", 34, 26),
        card("sy-f3", 980, 290, 380, 230, "Kafka", "key = productId", "cyan", 34, 26),
        card("sy-f4", 1420, 290, 430, 230, "Indexer", "_id = id DB, version ngoài", "green", 34, 26),
        cbox("sy-code", 110, 570, 1100, "external version",
             'PUT /products/_doc/9?version=5&version_type=external  → created\n'
             'PUT /products/_doc/9?version=3&version_type=external  → 409', "violet", 26),
        bigerr("sy-409", 1260, 580, 550, "✕ 409 version_conflict<br>bản cũ đến muộn bị từ chối", 28),
        tag("sy-app", 110, 300, 420, 120, "App", "amber", 38),
        tag("sy-al", 700, 300, 520, 120, "alias: products_live", "green", 32),
        tag("sy-v1", 1370, 280, 440, 110, "products", "muted", 32),
        tag("sy-v2", 1370, 440, 440, 110, "products_v2", "green", 32),
        cbox("sy-ac", 110, 600, 1100, "POST /_aliases (1 request, nguyên tử)",
             '{ "remove": { "index": "products",    "alias": "products_live" } },\n'
             '{ "add":    { "index": "products_v2", "alias": "products_live" } }', "violet", 26),
        note("sy-an", 1260, 620, 550, "_reindex: total 5, created 5", "green", 30),
        bigerr("sy-trap", 1260, 720, 550, "✕ v2 không có mapping:<br>term dien ra 0 thay vì 2", 28),
        take("sy", "Một đường ghi, lan truyền qua Kafka", "_id = id DB + version ngoài · đổi alias nguyên tử"),
        wires(arrow("sy-w1", [(535, 470), (755, 365)], "cyan"), arrow("sy-w2", [(535, 500), (755, 615)], "violet"),
              arrow("sy-g1", [(485, 405), (535, 405)], "cyan"), arrow("sy-g2", [(925, 405), (975, 405)], "cyan"),
              arrow("sy-g3", [(1365, 405), (1415, 405)], "cyan"),
              arrow("sy-x1", [(535, 360), (695, 360)], "amber"),
              arrow("sy-x3", [(1225, 370), (1365, 490)], "green")),
    ]), beats=[
        B("Elasticsearch gần như luôn là bản sao để tìm kiếm của database chính. Cách ai cũng nghĩ tới đầu tiên là dual write: lưu database rồi gọi Elasticsearch.",
          "Dual write: lưu database rồi gọi Elasticsearch.",
          lambda w: [IN("#sy-eye", "blur"), TYPE("#sy-q", 0.2, 0.05), *shrink("sy", w("Cách ai")),
                     IN("#sy-svc", "left", w("dual write")), *AW("sy-w1", w("lưu database"), 0.5), IN("#sy-db", "pop", w("lưu database") + 0.4),
                     *AW("sy-w2", w("rồi gọi"), 0.5), IN("#sy-es", "pop", w("rồi gọi") + 0.4)]),
        B("Nó hỏng theo nhiều kiểu. Ghi Elasticsearch lỗi sau khi commit thì thiếu tài liệu. Ghi xong mà transaction rollback thì có tài liệu ma. Hai cập nhật song song có thể đảo thứ tự.",
          "Hai hệ thống, không có chung transaction.",
          lambda w: [IN("#sy-e1", "pop", w("Ghi Elasticsearch")), IN("#sy-e2", "pop", w("Ghi xong")), IN("#sy-e3", "pop", w("Hai cập")),
                     SHAKE("#sy-es", w("Hai cập") + 0.8)]),
        B("Cách đúng là chỉ ghi một nơi. Trong cùng transaction, update product và insert một dòng vào bảng outbox. Relay hoặc Debezium đọc outbox hay WAL, đẩy lên Kafka với key là id sản phẩm. Indexer đọc event rồi ghi vào Elasticsearch.",
          "Outbox hoặc CDC → Kafka → indexer.",
          lambda w: [OUT(S("sy-svc", "sy-db", "sy-es", "sy-e1", "sy-e2", "sy-e3") + ", " + AR("sy-w1", "sy-w2"), "blur", 0, 0.5),
                     IN("#sy-f1", "up", w("Trong cùng")), *AW("sy-g1", w("Relay") - 0.4, 0.4), IN("#sy-f2", "up", w("Relay")),
                     *AW("sy-g2", w("đẩy lên") - 0.3, 0.4), IN("#sy-f3", "up", w("đẩy lên")),
                     *AW("sy-g3", w("Indexer") - 0.4, 0.4), IN("#sy-f4", "up", w("Indexer"))]),
        B("Kafka giao ít nhất một lần, nên indexer phải idempotent: id tài liệu bằng khoá chính trong database, kèm version ngoài. Chạy thật: ghi version năm, rồi event cũ version ba đến muộn bị từ chối, lỗi bốn trăm lẻ chín.",
          "Idempotent: _id = khoá chính, version_type=external.",
          lambda w: [PULSE("#sy-f4", w("id tài liệu")), IN("#sy-code", "blur", w("Chạy thật"), 0.7),
                     IN("#sy-409", "pop", w("bị từ chối")), SHAKE("#sy-409", w("bị từ chối") + 0.5)]),
        B("Đổi analyzer hay kiểu field thì phải có index mới. Từ ngày đầu, app chỉ gọi alias products live. Tạo products v2, reindex, rồi đổi alias trong một request: bỏ index cũ, thêm v2, nguyên tử, không có lúc trống.",
          "App chỉ biết alias. Đổi alias nguyên tử trong một request.",
          lambda w: [OUT(S("sy-f1", "sy-f2", "sy-f3", "sy-f4", "sy-code", "sy-409") + ", " + AR("sy-g1", "sy-g2", "sy-g3"), "blur", 0, 0.5),
                     IN("#sy-app", "left", w("app chỉ")), *AW("sy-x1", w("alias products"), 0.4), IN("#sy-al", "pop", w("alias products") + 0.3),
                     IN("#sy-v1", "fade", w("alias products") + 0.8), IN("#sy-v2", "up", w("Tạo products")), IN("#sy-an", "up", w("reindex")),
                     IN("#sy-ac", "blur", w("rồi đổi"), 0.6), DIM("#sy-v1", w("bỏ index"), 0.3), *AW("sy-x3", w("thêm v2"), 0.5)]),
        B("Bẫy hay gặp: reindex chỉ chép dữ liệu, không chép mapping. Lần chạy thử tạo v2 không có mapping, term dien ra không kết quả thay vì hai.",
          "_reindex không chép mapping: tạo v2 với mapping đầy đủ trước.",
          lambda w: [IN("#sy-trap", "pop", w("Lần chạy")), SHAKE("#sy-trap", w("ra không"))]),
        B("Tóm lại: một đường ghi, lan truyền qua Kafka, index bằng id cộng version, và đổi index bằng alias.",
          "Một đường ghi · id + version · alias.",
          lambda w: [DIM(S("sy-eye", "sy-q", "sy-app", "sy-al", "sy-v1", "sy-v2", "sy-ac", "sy-an", "sy-trap") + ", " + AR("sy-x1", "sy-x3"), 0, 0.07),
                     TYPE("#sy-t1", 0.3, 0.04), IN("#sy-t2", "blur", w("index bằng"))]),
    ]),
    # ------------------------------------------------------------ when not
    dict(id="when-not", world=(1920, 1080), hud="", cam="".join([
        head("wn", "Phần 6 · Khi nào không dùng", "Không phải nguồn sự thật"),
        el("wn-ask", 0, 270, 1920, None, "\"Có nên lưu luôn đơn hàng vào Elasticsearch?\"", "take-sm r", "font-size:40px"),
        card("wn-c1", 110, 370, 400, 260, "Không ACID", "chỉ nguyên tử trên một tài liệu", "red", 36, 26),
        card("wn-c2", 543, 370, 400, 260, "Near real-time", "search ngay sau ghi có thể chưa thấy", "red", 36, 26),
        card("wn-c3", 976, 370, 400, 260, "Không ràng buộc", "không unique, không khoá ngoại", "red", 36, 26),
        card("wn-c4", 1410, 370, 400, 260, "Đổi schema", "đổi kiểu field là reindex", "red", 36, 26),
        card("wn-pg", 110, 280, 830, 380, "PostgreSQL", "tsvector + GIN · unaccent · pg_trgm\ndữ liệu vừa, không cần đồng bộ, chung transaction", "cyan", 50, 30),
        card("wn-es", 980, 280, 830, 380, "Elasticsearch", "fuzzy, gợi ý khi gõ · facet trên dữ liệu lớn\nlog và phân tích · tách tải đọc", "violet", 50, 30),
        cbox("wn-code", 110, 260, 1060, "ProductDocument.java",
             '@Document(indexName = "products_live", createIndex = false)\n'
             'public class ProductDocument {\n'
             '  @Id private String id;\n'
             '  @Field(type = FieldType.Keyword) private String status;\n'
             '}', "violet", 26),
        note("wn-s1", 1220, 280, 600, "ElasticsearchRepository:\nsave, findById, findByStatus", "green", 30),
        note("wn-s2", 1220, 430, 600, "ElasticsearchOperations\n+ NativeQuery: bool, filter,\naggregation, search_after", "green", 30),
        note("wn-s3", 110, 620, 1700, "Tách ProductDocument khỏi JPA entity Product · ghi qua alias", "amber", 32, "center"),
        take("wn", "Quyết định nghiệp vụ đọc từ DB chính", "Elasticsearch chỉ để tìm và hiển thị"),
    ]), beats=[
        B("Câu chốt hay gặp: có nên lưu luôn đơn hàng vào Elasticsearch không? Không nên. Nó không có transaction nhiều tài liệu, đọc qua search là near real time, không có ràng buộc, và đổi schema là phải reindex.",
          "Không dùng ES làm nguồn sự thật.",
          lambda w: [IN("#wn-eye", "blur"), TYPE("#wn-q", 0.2, 0.05), *shrink("wn", w("Câu chốt")), IN("#wn-ask", "blur", w("có nên")),
                     IN("#wn-c1", "up", w("Nó không")), IN("#wn-c2", "up", w("đọc qua")), IN("#wn-c3", "up", w("không có ràng")), IN("#wn-c4", "up", w("đổi schema"))]),
        B("Dữ liệu vừa, chỉ cần tìm theo tên, có xếp hạng, gõ không dấu, thì PostgreSQL với tsvector, GIN, unaccent và pg trgm thường là đủ. Chọn Elasticsearch khi thật sự cần fuzzy, gợi ý khi gõ, facet trên dữ liệu lớn, hay phân tích log.",
          "Dữ liệu vừa: PostgreSQL full-text trước.",
          lambda w: [OUT(S("wn-ask", "wn-c1", "wn-c2", "wn-c3", "wn-c4"), "blur", 0, 0.5),
                     IN("#wn-pg", "up", w("thì PostgreSQL")), IN("#wn-es", "up", w("Chọn Elasticsearch"))]),
        B("Trong Spring Boot, Spring Data Elasticsearch cho annotation Document và Field để khai kiểu tường minh. Repository hợp CRUD và query đơn giản, còn query thật như bool, filter, aggregation thì dùng NativeQuery.",
          "Repository cho việc đơn giản, NativeQuery cho query thật.",
          lambda w: [OUT(S("wn-pg", "wn-es"), "blur", 0, 0.5), IN("#wn-code", "blur", 0.5, 0.7),
                     IN("#wn-s1", "left", w("Repository")), IN("#wn-s2", "left", w("còn query"))]),
        B("Nên tách class tài liệu tìm kiếm khỏi JPA entity, và ghi qua alias. Cuối cùng, đừng đọc lại từ Elasticsearch để quyết định còn hàng hay đơn đã thanh toán: quyết định nghiệp vụ đọc từ database chính.",
          "Đừng đọc ES để ra quyết định nghiệp vụ.",
          lambda w: [IN("#wn-s3", "up", 0.3), DIM(S("wn-eye", "wn-q", "wn-code", "wn-s1", "wn-s2", "wn-s3"), w("Cuối cùng"), 0.07),
                     TYPE("#wn-t1", w("Cuối cùng") + 0.3, 0.04), IN("#wn-t2", "blur", w("quyết định nghiệp"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Elasticsearch"), "h1 r", "font-size:92px"),
        *[box(f"ou-r{i}", 130, 190 + i * 110, 1660, 95, row(k, t, 38, 32), "cyan", "row")
          for i, (k, t) in enumerate([("Analyzer", "cùng analyzer hai đầu · asciifolding cho tiếng Việt"),
                                      ("Mapping", "text để tìm · keyword để lọc, sort, đếm"),
                                      ("Query", "chữ gõ vào must · điều kiện vào filter"),
                                      ("Shard", "primary chốt khi tạo · refresh khoảng 1 giây"),
                                      ("Đồng bộ", "outbox / CDC · id + version · alias"),
                                      ("Khi nào", "bản sao để tìm, không phải nguồn sự thật")])],
        el("ou-cta", 0, 880, 1920, None, "Mở bài học tương tác để làm quiz và xem từng request chạy thật", "cta r"),
    ]), beats=[
        B("Tóm lại. Analyzer: cùng analyzer ở hai đầu, thêm asciifolding cho tiếng Việt. Mapping: text để tìm, keyword để lọc, sort và đếm. Query: chữ gõ vào must, điều kiện vào filter.",
          "Analyzer · Mapping · Query.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "left", w("Analyzer:")), IN("#ou-r1", "left", w("Mapping:")), IN("#ou-r2", "left", w("Query:"))]),
        B("Shard: số primary chốt khi tạo, search thấy dữ liệu sau refresh. Đồng bộ: outbox hoặc CDC, id cộng version, và alias. Cuối cùng, Elasticsearch là bản sao để tìm kiếm, không phải nguồn sự thật.",
          "Shard · Đồng bộ · Khi nào không dùng.",
          lambda w: [IN("#ou-r3", "left", w("Shard:")), IN("#ou-r4", "left", w("Đồng bộ:")), IN("#ou-r5", "left", w("Cuối cùng"))]),
        B("Mở bài học tương tác để làm quiz và xem từng request chạy thật nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
