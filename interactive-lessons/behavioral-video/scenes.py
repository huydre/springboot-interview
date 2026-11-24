"""Behavioral nâng cao explainer: what interviewers grade, conflict, failure, ownership, sensitive questions, reverse questions.

Source: web/src/data/lessons/behavioral.ts. A soft-skills lesson: no code on screen, only cards, good vs bad answers and
checklists. Every sample answer is the lesson's own template (X and Y stay placeholders); the only figures used are the
lesson's guidance: answer 1.5 to 2 minutes (headline ~10s, context ~20s, action ~60s, result ~15s, learning ~15s),
6 to 8 stories, PoC of 2 days on 3 flows, migration locked the table ~10 minutes, estimate 3 days vs ~2 weeks,
incidents per month 4 -> 1, update every 15 minutes, notice period 45 days / 30 days (Labour Code 2019),
2 to 3 reverse questions per round, success after three months.
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


def head(p, eyebrow, title, size=84):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def take(p, main, sub):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(main), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(sub), "take-sm r"))


def take_in(p, d, sub_d):
    return [TYPE(f"#{p}-t1", d, 0.04), IN(f"#{p}-t2", "blur", sub_d)]


def card(id_, x, y, w, h, title, desc, ts=36, ds=27):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b>'
               f'<span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>',
               "cyan", "card")


def panel(id_, x, y, w, h, label, lines, tone="cyan", size=30, ls=30):
    """Left-aligned card: a coloured label, then one line per entry (good / bad answers, checklists)."""
    body = "".join(f'<div style="font-size:{size}px;line-height:1.35">{esc(t)}</div>' for t in lines)
    lab = f'<div style="font-size:{ls}px;font-weight:700;color:var(--tone)">{esc(label)}</div>' if label else ""
    return el(id_, x, y, w, h, lab + body, f"gbox {tone} r",
              "flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;padding:20px 34px")


def item(id_, x, y, w, h, mark, text, tone="green", size=30):
    """One checklist row: a coloured mark, then the text."""
    return el(id_, x, y, w, h,
              f'<span style="font-size:{size + 4}px;font-weight:800;color:var(--tone);min-width:44px">{esc(mark)}</span>'
              f'<span style="font-size:{size}px;line-height:1.3">{esc(text)}</span>',
              f"gbox {tone} r", "justify-content:flex-start;gap:18px;padding:0 30px")


def stamp(id_, x, y, w, h, text, tone):
    return el(id_, x, y, w, h, f'<span style="font-size:32px;font-weight:800;color:var(--tone)">{esc(text)}</span>',
              f"gbox {tone} r")


def arw(id_, x1, y1, x2, y2):
    return arrow(id_, [(x1, y1), (x2, y2)], "muted")


def AIN(id_, d, dur=0.4):
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def AR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


PARTS = [("Chấm gì", "năm tiêu chí"), ("Xung đột", "disagree and commit"), ("Thất bại", "lỗi thật của em"),
         ("Ownership", "impact bằng số"), ("Câu nhạy cảm", "nghỉ việc, lương"), ("Câu hỏi ngược", "và tiếng Anh")]

CRITERIA = [("Ownership", "coi vấn đề là việc của mình"), ("Collaboration", "làm việc khi bất đồng"),
            ("Learning", "sai rồi đổi được gì"), ("Impact", "khác biệt đo được"),
            ("Communication", "ý chính trước, biết dừng")]

# 2-minute answer: (name, seconds); 1600 px for 120 s
BEATS5 = [("Headline", 10), ("Bối cảnh", 20), ("Action", 60), ("Result", 15), ("Learning", 15)]


def bar():
    out, x = [], 160
    for i, (name, sec) in enumerate(BEATS5):
        w = round(sec * 1600 / 120)
        tone = "green" if name == "Action" else "cyan"
        out.append(el(f"wg-s{i}", x, 330, w - 8, 120, f'<span class="mono" style="font-size:30px;font-weight:700">{sec}s</span>',
                      f"gbox {tone} r"))
        out.append(el(f"wg-l{i}", x + w // 2 - 104, 470, 200, None, esc(name), "lbl r", "font-size:30px;color:var(--ink)"))
        x += w
    return "".join(out)


STORIES = ["Kỹ thuật khó", "Xung đột", "Sai lầm của em", "Ownership, sự cố", "Học nhanh", "Giúp người khác", "Deadline gấp"]


def story_grid():
    out = []
    for i, s in enumerate(STORIES):
        if i < 4:
            x, y = 110 + i * 433, 200
        else:
            x, y = 327 + (i - 4) * 433, 330
        out.append(stamp(f"wg-b{i}", x, y, 400, 100, s, "cyan"))
    return "".join(out)


SENS = [("Vì sao nghỉ việc?", "điều em muốn có, nối với vị trí này", "kể khổ, nói xấu sếp, lương là lý do chính"),
        ("Gap trong CV?", "lý do thật, ngắn, cách em giữ tay nghề", "xin lỗi dài dòng, bịa"),
        ("Điểm yếu?", "điểm yếu thật, không cốt lõi, đang cải thiện", "“em quá cầu toàn”, yếu đúng cốt lõi"),
        ("Kỳ vọng lương?", "một khoảng theo thị trường, gross hay net", "“bao nhiêu cũng được”, số quá thấp"),
        ("Có offer khác?", "sự thật ở mức chung, có mốc thời gian", "bịa offer để ép giá")]


def sens_rows():
    out = []
    for i, (q, ok, bad) in enumerate(SENS):
        y = 190 + i * 140
        out.append(el(f"ss-q{i}", 110, y, 380, 124, f'<b style="font-size:31px">{esc(q)}</b>', "gbox cyan r"))
        out.append(item(f"ss-o{i}", 510, y, 640, 124, "✓", ok, "green", 28))
        out.append(item(f"ss-x{i}", 1170, y, 640, 124, "✕", bad, "red", 28))
    return "".join(out)


SENS_IDS = [f"ss-{k}{i}" for i in range(5) for k in "qox"]

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        head("hk", "Behavioral nâng cao · Câu hỏi phỏng vấn", "Kể đúng khung vẫn có thể trượt"),
        *[card(f"hk-c{i}", 100 + i * 290, 300, 270, 250, n, d, 34, 26) for i, (n, d) in enumerate(PARTS)],
        el("hk-n", 160, 640, 1600, None, "Mọi câu mẫu trong bài là khung: thay bằng chuyện và con số thật của bạn", "note r",
           "font-size:34px"),
        take("hk", "Chuyện thật, số thật", "interviewer chấm tín hiệu, không chấm văn hay"),
    ]), beats=[
        B("Bạn đã biết kể chuyện theo khung Star. Nhưng kể đúng khung vẫn có thể trượt.",
          "Kể đúng khung STAR vẫn có thể trượt.",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05)]),
        B("Vì người phỏng vấn không chấm kể có hay không. Họ chấm những tín hiệu lộ ra trong câu chuyện.",
          "Họ chấm tín hiệu lộ ra trong câu chuyện.",
          lambda w: [*shrink("hk", w("Họ chấm"))]),
        B("Bài này có sáu phần: người phỏng vấn chấm gì, xung đột, thất bại, ownership, câu hỏi nhạy cảm, và câu hỏi ngược kèm tiếng Anh.",
          "Sáu phần của bài.",
          lambda w: [IN("#hk-c0", "pop", w("chấm gì")), IN("#hk-c1", "pop", w("xung đột")), IN("#hk-c2", "pop", w("thất bại")),
                     IN("#hk-c3", "pop", w("ownership")), IN("#hk-c4", "pop", w("câu hỏi nhạy")), IN("#hk-c5", "pop", w("câu hỏi ngược"))]),
        B("Mọi câu mẫu trong bài chỉ là khung. Hãy thay bằng chuyện thật và con số thật của bạn.",
          "Câu mẫu là khung: thay bằng chuyện thật của bạn.",
          lambda w: [IN("#hk-n", "up", 0.2),
                     OUT(S("hk-eye", "hk-q", "hk-n", *[f"hk-c{i}" for i in range(6)]), "blur", w("Hãy thay"), 0.5),
                     *take_in("hk", w("Hãy thay") + 0.6, w("chuyện thật") + 0.8)]),
    ]),
    # ------------------------------------------------------------ what-graded
    dict(id="what-graded", world=(1920, 1080), hud="", cam="".join([
        head("wg", "Phần 1", "Interviewer thật sự chấm gì"),
        *[card(f"wg-c{i}", 110 + i * 345, 230, 320, 230, n, d, 34, 27) for i, (n, d) in enumerate(CRITERIA)],
        panel("wg-bad", 110, 520, 1700, 120, "✕ Câu yếu", ["“Team em đã tối ưu API, giảm thời gian phản hồi rất nhiều.”"], "red"),
        stamp("wg-f0", 110, 660, 830, 80, "Ownership: phần của em ở đâu?", "red"),
        stamp("wg-f1", 980, 660, 830, 80, "Impact: “rất nhiều” là bao nhiêu?", "red"),
        panel("wg-good", 110, 770, 1700, 150, "✓ Câu tốt",
              ["“Em tìm ra truy vấn chậm và thêm index, p95 giảm từ khoảng X xuống Y theo Grafana.”"], "green"),
        el("wg-bt", 160, 220, 1600, None, "Câu trả lời 1,5 đến 2 phút, năm nhịp", "note left r", "font-size:36px;color:var(--ink)"),
        bar(),
        el("wg-an", 427, 545, 800, None, "Action: 2 đến 3 bước, mỗi bước một lý do", "note green r", "font-size:30px"),
        panel("wg-hl", 160, 630, 1600, 150, "Headline mẫu",
              ["“Đây là lần em phát hiện và sửa lỗi trừ tiền hai lần trên production, sau đó lỗi đó không lặp lại.”"], "cyan"),
        el("wg-end", 160, 820, 1600, None, "Kết: “Đó là cách em xử lý.” Rồi dừng.", "note left r", "font-size:34px"),
        el("wg-bk", 160, 470, 1600, None, "Ngân hàng 6 đến 8 câu chuyện thật", "note r", "font-size:34px;color:var(--ink)"),
        story_grid(),
        panel("wg-one", 110, 540, 1700, 160, "Mỗi chuyện ghi một dòng",
              ["Lỗi trừ tiền hai lần: thêm idempotency key, 0 lần trùng sau release · ownership, impact, learning"], "cyan"),
        item("wg-rule", 110, 740, 1700, 100, "✕", "Trong một buổi, không kể một chuyện hai lần", "red", 32),
        take("wg", "Câu này đo tiêu chí nào?", "ownership · collaboration · learning · impact · communication"),
    ]), beats=[
        B("Phần một: người phỏng vấn thật sự chấm gì. Mỗi câu hỏi thường nhắm vào một hai tiêu chí. Năm tiêu chí gặp nhiều nhất là ownership, collaboration, learning, impact và communication.",
          "5 tiêu chí: ownership, collaboration, learning, impact, communication.",
          lambda w: [IN("#wg-eye", "blur"), TYPE("#wg-q", 0.2, 0.05), *shrink("wg", w("Mỗi câu")),
                     IN("#wg-c0", "pop", w("ownership")), IN("#wg-c1", "pop", w("collaboration")), IN("#wg-c2", "pop", w("learning")),
                     IN("#wg-c3", "pop", w("impact")), IN("#wg-c4", "pop", w("communication"))]),
        B("Một tín hiệu chạy qua cả năm tiêu chí: em, hay team em. Câu team em đã tối ưu API, nhanh hơn rất nhiều, yếu ở hai chỗ. Không rõ phần của em, và rất nhiều thì không phải số.",
          "“Team em… rất nhiều”: không rõ phần của em, không có số.",
          lambda w: [IN("#wg-bad", "left", w("Câu team")), IN("#wg-f0", "up", w("Không rõ")), IN("#wg-f1", "up", w("và rất nhiều")),
                     SHAKE("#wg-bad", w("và rất nhiều") + 0.5)]),
        B("Sửa lại: em tìm ra truy vấn chậm và thêm index, độ trễ giảm từ khoảng bao nhiêu xuống bao nhiêu, theo dashboard. Nói em cho phần của em, team cho phần của team.",
          "Nói “em” cho phần của em, “team” cho phần của team.",
          lambda w: [IN("#wg-good", "left", 0.3), PULSE("#wg-good", w("Nói em"))]),
        B("Câu trả lời tốt dài khoảng một phút rưỡi đến hai phút, theo năm nhịp. Mở bằng một câu headline khoảng mười giây. Bối cảnh và nhiệm vụ hai mươi giây. Action dài nhất, khoảng sáu mươi giây. Rồi result và learning, mỗi phần khoảng mười lăm giây.",
          "Headline 10s · bối cảnh 20s · Action 60s · Result 15s · Learning 15s.",
          lambda w: [OUT(S("wg-c0", "wg-c1", "wg-c2", "wg-c3", "wg-c4", "wg-bad", "wg-f0", "wg-f1", "wg-good"), "blur", 0, 0.5),
                     IN("#wg-bt", "up", 0.7),
                     IN("#wg-s0, #wg-l0", "up", w("Mở bằng")), IN("#wg-s1, #wg-l1", "up", w("Bối cảnh")),
                     IN("#wg-s2, #wg-l2", "up", w("Action dài")), IN("#wg-an", "up", w("khoảng sáu")),
                     IN("#wg-s3, #wg-l3", "up", w("result")), IN("#wg-s4, #wg-l4", "up", w("learning,"))]),
        B("Headline cho người nghe biết ngay câu chuyện đi về đâu. Kết bằng một câu ngắn như: đó là cách em xử lý, rồi dừng. Im lặng sau câu kết là bình thường.",
          "Kết luận trước, chi tiết sau, rồi dừng.",
          lambda w: [PULSE("#wg-s0", 0.2), IN("#wg-hl", "up", 0.6), IN("#wg-end", "up", w("Kết bằng"))]),
        B("Đừng chuẩn bị từng câu hỏi. Hãy chuẩn bị sáu đến tám câu chuyện thật: kỹ thuật khó, xung đột, sai lầm của em, sự cố, học nhanh, giúp người khác và deadline gấp.",
          "Chuẩn bị 6 đến 8 câu chuyện thật, không chuẩn bị từng câu.",
          lambda w: [OUT(S("wg-bt", "wg-an", "wg-hl", "wg-end", *[f"wg-s{i}" for i in range(5)], *[f"wg-l{i}" for i in range(5)]), "blur", 0, 0.5),
                     IN("#wg-b0", "pop", w("kỹ thuật")), IN("#wg-b1", "pop", w("xung đột")), IN("#wg-b2", "pop", w("sai lầm")),
                     IN("#wg-b3", "pop", w("sự cố")), IN("#wg-b4", "pop", w("học nhanh")), IN("#wg-b5", "pop", w("giúp người")),
                     IN("#wg-b6", "pop", w("deadline"))]),
        B("Mỗi chuyện ghi một dòng: tên ngắn, số liệu chính, và các tiêu chí nó chứng minh. Một chuyện trả lời được nhiều câu hỏi, chỉ đổi điểm nhấn. Nhưng trong một buổi, đừng kể một chuyện hai lần.",
          "Một chuyện, nhiều khía cạnh. Không kể một chuyện hai lần.",
          lambda w: [IN("#wg-one", "up", 0.3), IN("#wg-rule", "left", w("Nhưng trong"))]),
        B("Trước khi trả lời, hãy tự hỏi: câu này đang đo tiêu chí nào?",
          "Câu này đang đo tiêu chí nào?",
          lambda w: [OUT(S("wg-eye", "wg-q", "wg-one", "wg-rule", *[f"wg-b{i}" for i in range(7)]), "blur", 0, 0.5),
                     *take_in("wg", 0.6, w("tiêu chí"))]),
    ]),
    # ------------------------------------------------------------ conflict
    dict(id="conflict", world=(1920, 1080), hud="", cam="".join([
        head("cf", "Phần 2", "Xử lý xung đột"),
        card("cf-k0", 140, 260, 520, 200, "Với đồng nghiệp", "“Kể về lần em bất đồng với teammate”"),
        card("cf-k1", 700, 260, 520, 200, "Với PM hoặc lead", "deadline vô lý, đổi phút chót"),
        card("cf-k2", 1260, 260, 520, 200, "Bất đồng kỹ thuật", "thư viện, kiến trúc, thiết kế"),
        *[item(f"cf-s{i}", 160, 190 + i * 112, 1600, 96, str(i + 1), t, "cyan", 32) for i, t in enumerate([
            "Nêu bất đồng trung lập: không ai là phản diện",
            "Hiểu lý do bên kia: em hỏi gì để hiểu họ lo ngại điều gì",
            "Đưa về dữ liệu hoặc tiêu chí chung: PoC, benchmark, rủi ro",
            "Kết quả: ai quyết, quyết thế nào",
            "Quan hệ sau đó và bài học"])],
        el("cf-miss", 160, 770, 1600, None, "Bước 2 hay bị bỏ qua nhất: thiếu nó, chuyện thành “em đúng, họ sai”", "note red left r", "font-size:32px"),
        panel("cf-bad", 110, 190, 820, 560, "✕ Cách kể tệ", [
            "Anh lead muốn MongoDB.", "Em biết ngay là sai.", "Em nói mấy lần nhưng anh ấy không nghe.",
            "Sau này có lỗi, em đã nói từ trước rồi.", "Nói chung anh ấy hơi bảo thủ."], "red", 30),
        panel("cf-good", 990, 190, 820, 560, "✓ Cách kể tốt", [
            "Lead muốn MongoDB vì schema đổi liên tục.", "Em lo phần trừ tiền, tồn kho cần transaction.",
            "Em hỏi rõ lo ngại, đề xuất PoC 2 ngày với 3 luồng nghiệp vụ.", "Đơn hàng ở PostgreSQL, catalog ở MongoDB.",
            "Em nhận phần đồng bộ và test cho nó."], "green", 30),
        stamp("cf-v0", 110, 790, 820, 100, "gắn nhãn · không dữ liệu", "red"),
        stamp("cf-v1", 990, 790, 820, 100, "trung lập · dữ liệu · cam kết", "green"),
        panel("cf-pre", 110, 200, 760, 250, "Trước khi quyết", ["Nói rõ khi không đồng ý,", "kể cả với cấp trên, bằng dữ liệu."], "cyan", 32),
        panel("cf-post", 1050, 200, 760, 250, "Sau khi quyết", ["Làm hết sức như phương án của mình.", "Ghi rủi ro. Không “em đã bảo rồi”."], "green", 32),
        panel("cf-pm", 110, 500, 1700, 160, "Với PM hoặc lead: đưa lựa chọn, để họ quyết",
              ["Giữ deadline: cắt A và B sang sprint sau · Cần đủ tính năng: thêm một tuần"], "amber", 32),
        item("cf-ex", 110, 700, 1700, 110, "!", "Ngoại lệ: bảo mật, dữ liệu khách, tiền, pháp lý: leo thang đúng kênh", "red", 32),
        wires(arw("cf-a", 880, 325, 1040, 325)),
        take("cf", "Nói bằng dữ liệu, rồi commit thật", "chuyện em thua mà vẫn làm hết sức thường thuyết phục hơn"),
    ]), beats=[
        B("Phần hai: xung đột. Đây là nơi collaboration lộ ra rõ nhất. Ba dạng hay gặp: bất đồng với đồng nghiệp, với quản lý sản phẩm hoặc lead, và bất đồng kỹ thuật.",
          "Ba dạng: với đồng nghiệp, với PM hoặc lead, bất đồng kỹ thuật.",
          lambda w: [IN("#cf-eye", "blur"), TYPE("#cf-q", 0.2, 0.05), *shrink("cf", w("Đây là")),
                     IN("#cf-k0", "pop", w("với đồng")), IN("#cf-k1", "pop", w("với quản")), IN("#cf-k2", "pop", w("và bất"))]),
        B("Khung trả lời năm bước. Nêu bất đồng trung lập. Hiểu lý do bên kia. Đưa về dữ liệu hoặc tiêu chí chung. Nói kết quả. Rồi quan hệ sau đó và bài học. Bước hiểu bên kia hay bị bỏ qua nhất.",
          "Năm bước. Bước hay bị bỏ qua nhất: hiểu lý do bên kia.",
          lambda w: [OUT(S("cf-k0", "cf-k1", "cf-k2"), "blur", 0, 0.4),
                     IN("#cf-s0", "left", w("Nêu")), IN("#cf-s1", "left", w("Hiểu")), IN("#cf-s2", "left", w("Đưa về")),
                     IN("#cf-s3", "left", w("Nói kết")), IN("#cf-s4", "left", w("Rồi quan")),
                     PULSE("#cf-s1", w("Bước hiểu")), IN("#cf-miss", "up", w("Bước hiểu") + 0.3)]),
        B("Cách kể tệ: lead muốn Mongo, em biết ngay là sai, nói mấy lần anh ấy không nghe, và anh ấy hơi bảo thủ. Không dữ liệu, gắn nhãn người khác, và chờ người kia sai.",
          "Cách kể tệ: gắn nhãn, không dữ liệu, chờ người kia sai.",
          lambda w: [OUT(S("cf-s0", "cf-s1", "cf-s2", "cf-s3", "cf-s4", "cf-miss"), "blur", 0, 0.4),
                     IN("#cf-bad", "left", 0.5), IN("#cf-v0", "up", w("Không dữ liệu")), SHAKE("#cf-v0", w("gắn nhãn"))]),
        B("Cách kể tốt: lead muốn Mongo vì schema đổi liên tục, em lo phần trừ tiền cần transaction. Em hỏi rõ lo ngại, rồi đề xuất làm thử hai ngày với ba luồng nghiệp vụ. Kết quả là phương án lai, và em nhận phần đồng bộ.",
          "Cách kể tốt: hiểu lo ngại, PoC 2 ngày, phương án lai, em nhận phần khó.",
          lambda w: [IN("#cf-good", "right", 0.3), IN("#cf-v1", "up", w("Kết quả")), PULSE("#cf-good", w("em nhận"))]),
        B("Đó là disagree and commit. Trước khi quyết, nói rõ bằng dữ liệu. Sau khi quyết, làm hết sức như phương án của mình, ghi lại rủi ro, và không nói em đã bảo rồi.",
          "Disagree and commit: nói rõ trước, cam kết thật sau.",
          lambda w: [OUT(S("cf-bad", "cf-good", "cf-v0", "cf-v1"), "blur", 0, 0.4),
                     IN("#cf-pre", "left", w("Trước khi")), *AIN("cf-a", w("Sau khi") - 0.2),
                     IN("#cf-post", "right", w("Sau khi"))]),
        B("Với quản lý sản phẩm, đừng chỉ nói không kịp. Hãy đưa lựa chọn: giữ deadline thì cắt bớt tính năng, cần đủ tính năng thì thêm một tuần. Ngoại lệ là bảo mật, dữ liệu khách, tiền và pháp lý: khi đó leo thang đúng kênh.",
          "Đưa lựa chọn có đánh đổi. Ngoại lệ: bảo mật, dữ liệu, tiền, pháp lý.",
          lambda w: [IN("#cf-pm", "up", w("Hãy đưa")), IN("#cf-ex", "up", w("Ngoại lệ"))]),
        B("Chuyện em thua mà vẫn làm hết sức thường thuyết phục hơn chuyện em thắng.",
          "Thua mà vẫn làm hết sức: thuyết phục hơn.",
          lambda w: [OUT(S("cf-eye", "cf-q", "cf-pre", "cf-post", "cf-pm", "cf-ex") + ", " + AR("cf-a"), "blur", 0, 0.5),
                     *take_in("cf", 0.6, w("thuyết phục"))]),
    ]),
    # ------------------------------------------------------------ failure
    dict(id="failure", world=(1920, 1080), hud="", cam="".join([
        head("fl", "Phần 3", "Kể về thất bại và sai lầm"),
        card("fl-c0", 140, 220, 520, 230, "Thật, là lỗi của em", "không phải lỗi của team, khách hay đồng nghiệp"),
        card("fl-c1", 700, 220, 520, 230, "Hậu quả vừa phải", "có ảnh hưởng thật, không phải thảm hoạ"),
        card("fl-c2", 1260, 220, 520, 230, "Có thay đổi cụ thể", "thói quen, quy trình, test, checklist"),
        *[el(f"fl-f{i}", 160 + i * 269, 540, 255, 110, f'<b style="font-size:29px;text-align:center">{esc(t)}</b>',
             f"gbox {'green' if i >= 4 else 'cyan'} r") for i, t in enumerate(
            ["Lỗi là gì", "Hậu quả", "Xử lý ngay", "Nguyên nhân gốc", "Thay đổi", "Bằng chứng"])],
        el("fl-long", 1236, 670, 524, None, "phần dài nhất", "note green r", "font-size:32px"),
        *[panel(f"fl-r{i}", 110, 190 + i * 150, 1260, 130, "", [t], "cyan", 28) for i, t in enumerate([
            "“Thất bại của em là quá cầu toàn, em hay làm thêm giờ để code thật hoàn hảo.”",
            "“Dự án trễ vì bên QA test chậm và PM thay đổi yêu cầu liên tục.”",
            "Migration không thử trên bản sao production, khoá bảng khoảng 10 phút. Rollback, từ đó mọi migration chạy thử trước.",
            "Ước lượng 3 ngày, mất gần 2 tuần vì không đọc kỹ tài liệu sandbox. Từ đó dành nửa ngày spike trước."])],
        *[stamp(f"fl-v{i}", 1410, 190 + i * 150, 400, 130, t, tone) for i, (t, tone) in enumerate(
            [("Thất bại giả", "red"), ("Đổ lỗi", "red"), ("Chuyện tốt", "green"), ("Chuyện tốt", "green")])],
        panel("fl-trap", 110, 200, 1700, 170, "✕ Nhận lỗi rồi lại rút lại",
              ["“Lỗi là do em, nhưng thật ra do tài liệu không rõ và không ai review kỹ.”"], "red"),
        el("fl-trn", 110, 395, 1700, None, "Nửa sau xoá nửa đầu", "note red left r", "font-size:32px"),
        el("fl-fq", 110, 500, 1700, None, "“Nếu làm lại, em làm khác ở điểm nào?”", "note left r", "font-size:36px;color:var(--ink)"),
        item("fl-fb", 110, 570, 1700, 100, "✕", "“Em sẽ cẩn thận hơn.”", "red", 32),
        item("fl-fg", 110, 690, 1700, 120, "✓", "“Em sẽ chạy migration trên bản sao dữ liệu production và đo thời gian khoá trước khi lên lịch release.”", "green", 30),
        take("fl", "Phần thay đổi mới được chấm", "lỗi thật của em + hậu quả vừa phải + thay đổi có bằng chứng"),
    ]), beats=[
        B("Phần ba: thất bại. Câu này đo learning và sự trung thực. Chọn chuyện theo ba tiêu chí: thật và là lỗi của em, hậu quả vừa phải, và có thay đổi cụ thể sau đó.",
          "Ba tiêu chí: lỗi thật của em, hậu quả vừa phải, thay đổi cụ thể.",
          lambda w: [IN("#fl-eye", "blur"), TYPE("#fl-q", 0.2, 0.05), *shrink("fl", w("Câu này")),
                     IN("#fl-c0", "pop", w("thật và")), IN("#fl-c1", "pop", w("hậu quả")), IN("#fl-c2", "pop", w("và có thay"))]),
        B("Kể theo thứ tự: lỗi là gì, hậu quả, xử lý ngay thế nào, nguyên nhân gốc, em thay đổi gì, và bằng chứng thay đổi có tác dụng. Hai phần cuối nên dài nhất.",
          "Lỗi → hậu quả → xử lý → nguyên nhân gốc → thay đổi → bằng chứng.",
          lambda w: [IN("#fl-f0", "up", w("lỗi là")), IN("#fl-f1", "up", w("hậu quả,")), IN("#fl-f2", "up", w("xử lý")),
                     IN("#fl-f3", "up", w("nguyên nhân")), IN("#fl-f4", "up", w("em thay")), IN("#fl-f5", "up", w("và bằng")),
                     IN("#fl-long", "up", w("Hai phần")), PULSE("#fl-f4, #fl-f5", w("Hai phần") + 0.4)]),
        B("Thử phân loại. Em quá cầu toàn, hay làm thêm giờ: đó là thất bại giả, khoe được ngụy trang. Dự án trễ vì bên kiểm thử chậm và yêu cầu đổi liên tục: đó là đổ lỗi.",
          "“Quá cầu toàn”: thất bại giả. Trễ vì người khác: đổ lỗi.",
          lambda w: [OUT(S("fl-c0", "fl-c1", "fl-c2", "fl-long", *[f"fl-f{i}" for i in range(6)]), "blur", 0, 0.4),
                     IN("#fl-r0", "left", w("Em quá")), IN("#fl-v0", "pop", w("đó là thất")),
                     IN("#fl-r1", "left", w("Dự án")), IN("#fl-v1", "pop", w("đó là đổ"))]),
        B("Còn đây là chuyện tốt: em chạy migration không thử trước, khoá bảng khoảng mười phút, em rollback, và từ đó mọi migration đều chạy thử trên bản sao. Hay ước lượng ba ngày mà mất gần hai tuần, từ đó em dành nửa ngày tìm hiểu trước khi báo ước lượng.",
          "Chuyện tốt: lỗi thật, hậu quả vừa phải, thay đổi cụ thể.",
          lambda w: [IN("#fl-r2", "left", w("em chạy")), IN("#fl-v2", "pop", w("và từ đó")),
                     IN("#fl-r3", "left", w("Hay ước")), IN("#fl-v3", "pop", w("từ đó em"))]),
        B("Bẫy hay gặp: nhận lỗi rồi lại rút lại. Lỗi là do em, nhưng thật ra do tài liệu không rõ. Nửa sau xoá nửa đầu.",
          "Bẫy: nhận lỗi rồi lại rút lại.",
          lambda w: [OUT(S(*[f"fl-r{i}" for i in range(4)], *[f"fl-v{i}" for i in range(4)]), "blur", 0, 0.4),
                     IN("#fl-trap", "left", 0.5), IN("#fl-trn", "up", w("Nửa sau")), SHAKE("#fl-trap", w("Nửa sau"))]),
        B("Khi bị hỏi nếu làm lại thì sao, đừng nói em sẽ cẩn thận hơn. Hãy nêu một hành động cụ thể, kiểm chứng được.",
          "“Cẩn thận hơn” không phải hành động. Nêu việc cụ thể.",
          lambda w: [IN("#fl-fq", "up", 0.2), IN("#fl-fb", "left", w("đừng nói")), IN("#fl-fg", "left", w("Hãy nêu"))]),
        B("Phần thay đổi sau lỗi mới là điều người phỏng vấn chấm, nên nó phải dài nhất.",
          "Phần thay đổi sau lỗi phải dài nhất.",
          lambda w: [OUT(S("fl-eye", "fl-q", "fl-trap", "fl-trn", "fl-fq", "fl-fb", "fl-fg"), "blur", 0, 0.5),
                     *take_in("fl", 0.6, w("nên nó"))]),
    ]),
    # ------------------------------------------------------------ ownership
    dict(id="ownership", world=(1920, 1080), hud="", cam="".join([
        head("ow", "Phần 4", "Ownership và vượt phạm vi"),
        card("ow-k0", 140, 210, 800, 200, "Sự cố production", "nửa đêm, cuối tuần: xử lý thế nào, rồi làm gì để không lặp lại"),
        card("ow-k1", 980, 210, 800, 200, "Việc không ai nhận", "test flaky, tài liệu cũ, alert không ai xem"),
        *[card(f"ow-n{i}", 160 + i * 420, 470, 340, 170, t, d, 32, 26) for i, (t, d) in enumerate(
            [("1 · Giảm ảnh hưởng", "rollback, tắt feature flag"), ("2 · Báo sớm", "cập nhật đều, mỗi 15 phút"),
             ("3 · Nguyên nhân gốc", "khi hệ thống đã ổn"), ("4 · Postmortem", "không đổ lỗi, việc có người nhận")])],
        item("ow-flag", 160, 690, 1600, 100, "✕", "Tự sửa thẳng trên production lúc 2 giờ sáng, không báo ai", "red", 32),
        el("ow-ask", 160, 820, 1600, None, "Nói rõ em đã báo ai và xin phép ai", "note green left r", "font-size:34px"),
        panel("ow-bad", 110, 190, 820, 170, "✕ Cảm nhận", ["“Hệ thống ổn định hơn.”"], "red", 34),
        panel("ow-good", 990, 190, 820, 170, "✓ Impact", ["“Số sự cố mỗi tháng giảm từ 4 xuống 1.”"], "green", 34),
        *[card(f"ow-g{i}", 110 + i * 433, 400, 400, 200, t, d, 32, 26) for i, (t, d) in enumerate(
            [("Hiệu năng", "latency p95, batch, thời gian CI"), ("Độ tin cậy", "số sự cố, tỉ lệ lỗi, thời gian khôi phục"),
             ("Năng suất team", "giờ làm tay được tự động hoá"), ("Chi phí, người dùng", "hạ tầng, ticket hỗ trợ")])],
        *[item(f"ow-r{i}", 110, 640 + i * 95, 1700, 80, "✓", t, "green", 30) for i, t in enumerate(
            ["Số thật, nói được nguồn: “theo Grafana”, “theo báo cáo sprint”",
             "Không nhớ chính xác: nói khoảng, và nói là khoảng",
             "Không có số: kết quả định tính thật, không bịa"])],
        wires(*[arw(f"ow-a{i}", 505 + i * 420, 555, 575 + i * 420, 555) for i in range(3)]),
        take("ow", "Số thật, có nguồn", "một con số bịa vỡ sau hai câu hỏi xoáy"),
    ]), beats=[
        B("Phần bốn: ownership, tức là em làm gì khi không ai bắt em làm. Đây là tiêu chí phân biệt rõ nhất giữa mid và senior. Hai dạng chuyện mạnh nhất: sự cố production, và việc không ai nhận.",
          "Ownership: em làm gì khi không ai bắt em làm.",
          lambda w: [IN("#ow-eye", "blur"), TYPE("#ow-q", 0.2, 0.05), *shrink("ow", w("Đây là")),
                     IN("#ow-k0", "pop", w("sự cố")), IN("#ow-k1", "pop", w("và việc"))]),
        B("Với sự cố, kể theo đúng thứ tự ưu tiên. Giảm ảnh hưởng trước, như rollback hay tắt feature flag. Báo sớm và cập nhật đều. Tìm nguyên nhân gốc khi hệ thống đã ổn. Rồi postmortem không đổ lỗi.",
          "Giảm ảnh hưởng → báo sớm → nguyên nhân gốc → postmortem.",
          lambda w: [IN("#ow-n0", "up", w("Giảm")), *AIN("ow-a0", w("Báo sớm") - 0.4), IN("#ow-n1", "up", w("Báo sớm")),
                     *AIN("ow-a1", w("Tìm") - 0.4), IN("#ow-n2", "up", w("Tìm")),
                     *AIN("ow-a2", w("Rồi post") - 0.4), IN("#ow-n3", "up", w("Rồi post"))]),
        B("Ownership không có nghĩa là làm một mình. Người tự sửa trên production lúc hai giờ sáng mà không báo ai làm người phỏng vấn lo ngại. Hãy nói rõ em đã báo ai và xin phép ai.",
          "Không làm âm thầm: nói rõ đã báo ai, xin phép ai.",
          lambda w: [IN("#ow-flag", "left", w("Người tự")), SHAKE("#ow-flag", w("làm người")), IN("#ow-ask", "up", w("Hãy nói"))]),
        B("Chuyện ownership chỉ trọn vẹn khi có kết quả. Hệ thống ổn định hơn là cảm nhận. Số sự cố mỗi tháng giảm từ bốn xuống một mới là impact.",
          "“Ổn định hơn” là cảm nhận. “Sự cố 4 → 1 mỗi tháng” là impact.",
          lambda w: [OUT(S("ow-k0", "ow-k1", "ow-n0", "ow-n1", "ow-n2", "ow-n3", "ow-flag", "ow-ask") + ", " + AR("ow-a0", "ow-a1", "ow-a2"), "blur", 0, 0.5),
                     IN("#ow-bad", "left", w("Hệ thống")), IN("#ow-good", "right", w("Số sự cố"))]),
        B("Dev backend có bốn nhóm số: hiệu năng, độ tin cậy, năng suất team, và chi phí hay người dùng.",
          "Bốn nhóm số: hiệu năng, độ tin cậy, năng suất, chi phí.",
          lambda w: [IN("#ow-g0", "pop", w("hiệu năng")), IN("#ow-g1", "pop", w("độ tin")), IN("#ow-g2", "pop", w("năng suất")),
                     IN("#ow-g3", "pop", w("và chi phí"))]),
        B("Quy tắc: số phải thật và nói được nguồn. Không nhớ chính xác thì nói khoảng. Không có số thì nói kết quả định tính thật, đừng bịa.",
          "Số thật có nguồn · nói khoảng · không bịa.",
          lambda w: [IN("#ow-r0", "left", w("số phải")), IN("#ow-r1", "left", w("Không nhớ")), IN("#ow-r2", "left", w("Không có số"))]),
        B("Một con số bịa sẽ vỡ sau hai câu hỏi xoáy, và kéo theo mất niềm tin vào cả buổi.",
          "Số bịa vỡ sau hai câu hỏi xoáy.",
          lambda w: [OUT(S("ow-eye", "ow-q", "ow-bad", "ow-good", *[f"ow-g{i}" for i in range(4)], *[f"ow-r{i}" for i in range(3)]), "blur", 0, 0.5),
                     *take_in("ow", 0.6, w("và kéo"))]),
    ]),
    # ------------------------------------------------------------ sensitive
    dict(id="sensitive", world=(1920, 1080), hud="", cam="".join([
        head("ss", "Phần 5", "Câu hỏi nhạy cảm"),
        card("ss-p0", 140, 250, 520, 220, "Trung thực, chọn lọc", "không nói dối, nhưng không cần kể hết"),
        card("ss-p1", 700, 250, 520, 220, "Ngắn, rồi hướng tới", "vài câu về quá khứ, một câu về việc mới"),
        card("ss-p2", 1260, 250, 520, 220, "Không nói xấu ai", "công ty, sếp, đồng nghiệp cũ"),
        sens_rows(),
        panel("ss-gn", 110, 200, 820, 220, "Gross hay net?", ["gross: trước thuế và bảo hiểm", "net: số thực nhận · luôn nói rõ"], "cyan", 30),
        panel("ss-tot", 990, 200, 820, 220, "Tổng thu nhập", ["thưởng tháng 13, theo hiệu suất", "bảo hiểm sức khoẻ, phép, làm từ xa"], "cyan", 30),
        panel("ss-rg", 110, 450, 1700, 150, "✓ Mẫu câu",
              ["“Em mong muốn trong khoảng X đến Y gross mỗi tháng, tuỳ phạm vi công việc và chế độ thưởng.”"], "green", 30),
        panel("ss-nt", 110, 630, 1700, 170, "Báo trước (Bộ luật Lao động 2019)",
              ["ít nhất 45 ngày: hợp đồng không xác định thời hạn · 30 ngày: hợp đồng 12 đến 36 tháng"], "amber", 30),
        item("ss-fake", 110, 830, 1700, 90, "✕", "Không bịa offer để ép giá", "red", 32),
        take("ss", "Hướng về điều em muốn có", "trung thực · ngắn gọn · không nói xấu ai"),
    ]), beats=[
        B("Phần năm: những câu ai cũng bị hỏi, và dễ trả lời sai vì cảm xúc. Ba nguyên tắc chung: trung thực nhưng chọn lọc, nói ngắn rồi hướng về phía trước, và không nói xấu ai.",
          "Trung thực nhưng chọn lọc · ngắn, hướng tới · không nói xấu ai.",
          lambda w: [IN("#ss-eye", "blur"), TYPE("#ss-q", 0.2, 0.05), *shrink("ss", w("Ba nguyên") - 1.0),
                     IN("#ss-p0", "pop", w("trung thực")), IN("#ss-p1", "pop", w("nói ngắn")), IN("#ss-p2", "pop", w("và không"))]),
        B("Vì sao nghỉ việc: nói điều em muốn có, và nối với vị trí này, đừng kể khổ hay lấy lương làm lý do chính. Khoảng trống trong CV: nói lý do thật, ngắn, và cách em giữ tay nghề.",
          "Nghỉ việc: điều em muốn có. Gap: lý do thật, ngắn.",
          lambda w: [OUT(S("ss-p0", "ss-p1", "ss-p2"), "blur", 0, 0.4),
                     IN("#ss-q0", "left", 0.4), IN("#ss-o0", "up", w("nói điều")), IN("#ss-x0", "up", w("đừng kể")),
                     IN("#ss-q1", "left", w("Khoảng trống")), IN("#ss-o1", "up", w("nói lý do")), IN("#ss-x1", "up", w("nói lý do") + 1.5)]),
        B("Điểm yếu: chọn điểm yếu thật nhưng không thuộc cốt lõi của vị trí, kèm việc đang làm để cải thiện. Kỳ vọng lương: đưa một khoảng. Offer khác: nói thật, có mốc thời gian, không bịa để ép giá.",
          "Điểm yếu thật, không cốt lõi · lương: một khoảng · offer: nói thật.",
          lambda w: [IN("#ss-q2", "left", 0.1), IN("#ss-o2", "up", w("chọn")), IN("#ss-x2", "up", w("kèm việc")),
                     IN("#ss-q3", "left", w("Kỳ vọng")), IN("#ss-o3", "up", w("đưa một")), IN("#ss-x3", "up", w("đưa một") + 1.0),
                     IN("#ss-q4", "left", w("Offer")), IN("#ss-o4", "up", w("nói thật")), IN("#ss-x4", "up", w("không bịa"))]),
        B("Về lương, luôn nói rõ gross hay net. Gross là trước thuế và bảo hiểm, net là số thực nhận. Hãy nhìn tổng thu nhập: thưởng, bảo hiểm sức khoẻ, ngày phép. Và đưa ra một khoảng mà mức thấp nhất vẫn là mức em chấp nhận được.",
          "Nói rõ gross hay net, nhìn tổng thu nhập, đưa một khoảng.",
          lambda w: [OUT(S(*SENS_IDS), "blur", 0, 0.5),
                     IN("#ss-gn", "left", w("Gross là")), IN("#ss-tot", "right", w("Hãy nhìn")), IN("#ss-rg", "up", w("Và đưa"))]),
        B("Khi được hỏi bao giờ đi làm, nhớ thời gian báo trước: theo Bộ luật Lao động hai nghìn không trăm mười chín, ít nhất bốn mươi lăm ngày với hợp đồng không xác định thời hạn, và ba mươi ngày với hợp đồng từ mười hai đến ba mươi sáu tháng. Và đừng bao giờ bịa offer.",
          "Báo trước: 45 ngày hoặc 30 ngày. Không bịa offer.",
          lambda w: [IN("#ss-nt", "up", w("nhớ thời")), IN("#ss-fake", "left", w("Và đừng"))]),
        B("Với mọi câu nhạy cảm: trung thực, ngắn gọn, và hướng về điều em muốn có.",
          "Trung thực, ngắn, hướng về điều em muốn có.",
          lambda w: [OUT(S("ss-eye", "ss-q", "ss-gn", "ss-tot", "ss-rg", "ss-nt", "ss-fake"), "blur", 0, 0.5),
                     *take_in("ss", 0.6, w("ngắn gọn"))]),
    ]),
    # ------------------------------------------------------------ reverse-english
    dict(id="reverse-english", world=(1920, 1080), hud="", cam="".join([
        head("re", "Phần 6", "Câu hỏi ngược và tiếng Anh"),
        *[panel(f"re-c{i}", 110 + i * 580, 200, 540, 440, t, [topic, "", q], "cyan", 29, 36) for i, (t, topic, q) in enumerate([
            ("HR / recruiter", "quy trình, lịch các vòng, chế độ, thử việc",
             "“What are the next steps, and when can I expect to hear back?”"),
            ("Tech lead", "thách thức kỹ thuật, review, deploy, sự cố",
             "“How does a change go from pull request to production?”"),
            ("Engineering manager", "kỳ vọng, cách đánh giá, lộ trình phát triển",
             "“What would success look like for this role after the first three months?”")])],
        item("re-av", 110, 680, 1700, 100, "✕", "Hỏi điều có trên website · hỏi lương với tech lead · “em không có câu hỏi”", "red", 30),
        el("re-n", 110, 810, 1700, None, "Chuẩn bị 2 đến 3 câu cho mỗi vòng", "note green left r", "font-size:34px"),
        *[panel(f"re-e{i}", 110 + (i % 2) * 880, 190 + (i // 2) * 230, 820, 200, t, [p], "cyan", 30, 30) for i, (t, p) in enumerate([
            ("Không nghe rõ", "“Sorry, could you repeat the question?”"),
            ("Cần thời gian nghĩ", "“That's a good question. Let me think for a moment.”"),
            ("Nhận lỗi", "“It was my mistake. Since then, I always...”"),
            ("Không biết câu trả lời", "“I haven't worked with that directly, but here is how I would approach it.”")])],
        panel("re-chk", 110, 670, 1700, 120, "Không chắc họ hỏi gì: diễn đạt lại để kiểm tra",
              ["“Just to make sure I understand, are you asking about...?”"], "green", 30),
        item("re-iwe", 110, 820, 1700, 90, "✓", "“I” cho phần của em · “we” cho phần của team", "green", 32),
        take("re", "Hỏi đúng người", "HR: quy trình · tech lead: kỹ thuật · manager: kỳ vọng"),
    ]), beats=[
        B("Phần sáu: cuối mỗi vòng gần như luôn có câu: em có câu hỏi gì không. Câu hỏi ngược tốt cho thấy em đang đánh giá công ty, không chỉ chờ được chọn. Hãy chọn câu theo người đang ngồi đối diện.",
          "Câu hỏi ngược: chọn theo người ngồi đối diện.",
          lambda w: [IN("#re-eye", "blur"), TYPE("#re-q", 0.2, 0.05), *shrink("re", w("Câu hỏi ngược"))]),
        B("Với nhân sự, hỏi quy trình, lịch các vòng và chế độ. Với tech lead, hỏi thách thức kỹ thuật, và một thay đổi đi tới production thế nào. Với engineering manager, hỏi sau ba tháng thế nào là làm tốt.",
          "HR: quy trình · tech lead: kỹ thuật · manager: kỳ vọng sau 3 tháng.",
          lambda w: [IN("#re-c0", "up", w("Với nhân")), IN("#re-c1", "up", w("Với tech")), IN("#re-c2", "up", w("Với engineering"))]),
        B("Tránh hỏi điều có trên website, hỏi lương với tech lead, hay nói em không có câu hỏi. Chuẩn bị hai đến ba câu cho mỗi vòng.",
          "Tránh: điều có trên website, lương với tech lead, “không có câu hỏi”.",
          lambda w: [IN("#re-av", "left", 0.2), IN("#re-n", "up", w("Chuẩn bị"))]),
        B("Phỏng vấn bằng tiếng Anh, họ không chờ tiếng Anh hoàn hảo. Họ chấm em diễn đạt rõ ý, và xử lý được lúc không hiểu. Không nghe rõ thì xin nhắc lại. Cần nghĩ thì nói ra, đừng im lặng quá lâu.",
          "Tiếng Anh: rõ ý, xử lý được lúc không hiểu.",
          lambda w: [OUT(S("re-c0", "re-c1", "re-c2", "re-av", "re-n"), "blur", 0, 0.5),
                     IN("#re-e0", "up", w("Không nghe")), IN("#re-e1", "up", w("Cần nghĩ"))]),
        B("Nhận lỗi thì ngắn và thẳng. Không biết thì thừa nhận, rồi nói cách em sẽ suy luận. Không chắc họ hỏi gì thì diễn đạt lại câu hỏi để kiểm tra, đừng đoán rồi trả lời lạc đề.",
          "Không chắc câu hỏi: diễn đạt lại để kiểm tra.",
          lambda w: [IN("#re-e2", "up", w("Nhận lỗi")), IN("#re-e3", "up", w("Không biết")), IN("#re-chk", "up", w("Không chắc"))]),
        B("Và dùng ngôi số ít cho phần của em, ngôi số nhiều cho phần của team, giống em và team ở phần một.",
          "“I” cho phần của em, “we” cho phần của team.",
          lambda w: [IN("#re-iwe", "left", 0.2)]),
        B("Cuối buổi, hỏi đúng người: nhân sự về quy trình, tech lead về kỹ thuật, manager về kỳ vọng.",
          "Hỏi đúng người.",
          lambda w: [OUT(S("re-eye", "re-q", "re-e0", "re-e1", "re-e2", "re-e3", "re-chk", "re-iwe"), "blur", 0, 0.5),
                     *take_in("re", 0.6, w("nhân sự"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 50, 1920, None, letters("Tóm tắt Behavioral nâng cao"), "h1 r", "font-size:84px"),
        *[el(f"ou-r{i}", 130, 190 + i * 112, 1660, 96,
             f'<span class="mono big" style="font-size:38px">{esc(k)}</span><span style="font-size:32px">{esc(t)}</span>',
             "gbox cyan row r")
          for i, (k, t) in enumerate([("Chấm gì", "5 tiêu chí · nói “em” · 2 phút · 6 đến 8 chuyện"),
                                      ("Xung đột", "hiểu bên kia · dữ liệu · disagree and commit"),
                                      ("Thất bại", "lỗi thật của em · thay đổi có bằng chứng"),
                                      ("Ownership", "giảm ảnh hưởng trước · số thật có nguồn"),
                                      ("Nhạy cảm", "trung thực · ngắn · không nói xấu ai"),
                                      ("Câu hỏi ngược", "hỏi đúng người · hỏi lại khi chưa rõ")])],
        el("ou-cta", 0, 880, 1920, None, "Mở bài học tương tác để làm quiz và luyện từng tình huống", "cta r"),
    ]), beats=[
        B("Tóm lại. Người phỏng vấn chấm năm tiêu chí, nên hãy nói em cho phần của em, trả lời trong khoảng hai phút, và chuẩn bị sáu đến tám chuyện thật. Xung đột: hiểu bên kia, dùng dữ liệu, rồi commit thật.",
          "Chấm gì và xung đột.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Người phỏng")), IN("#ou-r1", "right", w("Xung đột"))]),
        B("Thất bại: lỗi thật của em, và thay đổi có bằng chứng. Ownership: giảm ảnh hưởng trước, và số thật có nguồn.",
          "Thất bại và ownership.",
          lambda w: [IN("#ou-r2", "right", w("Thất bại")), IN("#ou-r3", "right", w("Ownership"))]),
        B("Câu nhạy cảm: trung thực, ngắn, không nói xấu ai. Cuối buổi, hỏi đúng người, và hỏi lại khi chưa rõ.",
          "Câu nhạy cảm và câu hỏi ngược.",
          lambda w: [IN("#ou-r4", "right", w("Câu nhạy")), IN("#ou-r5", "right", w("Cuối buổi"))]),
        B("Mở bài học tương tác để làm quiz và luyện từng tình huống nhé.",
          "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
