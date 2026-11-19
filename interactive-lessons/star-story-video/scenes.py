"""Project Story & STAR explainer: scene layouts and per-beat narration + motion.

Source: study note 10.03 (Project Story & STAR) and the fill-in profile of note 09, via web lesson star-story.ts.
The note deliberately invents no company examples or numbers, and neither does this video: every result slot is a
placeholder for the viewer's own measured numbers. Figures shown are only the note's own guidance: introduction in
1-2 minutes in 5 parts, S and T short, A longest, R measured, plus L; weak answer "API chậm, em phát hiện N+1 nên dùng
JOIN FETCH, sau đó nhanh hơn nhiều"; strong Action: SQL log counts 1 + N queries, JOIN FETCH / @EntityGraph / batch size,
a test counting SQL statements; 8 behavioral topics; 7 order-service labs mapped to topics (N+1, @Version with
OptimisticLockException vs conditional UPDATE stock >= qty, index + EXPLAIN, @Cacheable, JWT, @Transactional bugs,
Testcontainers); each story about 2 minutes with 2-3 follow-up questions; 5-6 reverse questions, ask 2-3; last week:
1-minute self intro, 2-minute project intro, 8 stories with real numbers, read the JD, one system design problem.
No Java on screen. Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

INTRO_PARTS = [("Bối cảnh", "domain, người dùng"), ("Quy mô", "số chắc chắn biết"), ("Kiến trúc", "stack, DB, queue"),
               ("Vai trò", "nói “em”"), ("Điểm nhấn", "nêu tên, chờ hỏi")]


def intro_nodes():
    out = []
    for i, (name, sub) in enumerate(INTRO_PARTS):
        x = 120 + i * 350
        out.append(gnode(f"in-n{i}", x, 250, 290, 110, name, "cyan"))
        out.append(el(f"in-s{i}", x - 20, 380, 330, None, esc(sub), "lbl r"))
    return "".join(out)


LABS = [("N+1 trên GET /orders", "Hiệu năng, vấn đề khó nhất"), ("@Version: 2 thread cùng trừ kho", "Concurrency"),
        ("Composite index + EXPLAIN", "Tối ưu query"), ("@Cacheable Redis + evict", "Trade-off"),
        ("JWT + phân quyền", "Học nhanh công nghệ mới"), ("Lỗi @Transactional", "Mắc lỗi, bài học"),
        ("Testcontainers", "Chủ động cải thiện")]


def lab_rows():
    out, traces = [], []
    for i, (lab, topic) in enumerate(LABS):
        y = 190 + i * 92
        out.append(box(f"lb-l{i}", 160, y, 760, 72, f"<b>{esc(lab)}</b>", "violet", "card"))
        out.append(chip(f"lb-t{i}", 1040, y + 6, topic, "green"))
        traces.append(trace(f"lb-w{i}", [(930, y + 36), (1024, y + 36)], "violet"))
    return "".join(out) + wires(*traces)


def lab_in(i, d):
    return [IN(f"#lb-l{i}", "left", d, 0.5), DRAW(f"#lb-w{i}-p", d + 0.4, 0.35), IN(f"#lb-t{i}", "pop", d + 0.7)]


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("Giới thiệu dự án gần nhất của em?"), "h1 center r"),
        gnode("hk-a", 300, 470, 520, 120, "Câu trả lời của em", "cyan"),
        gnode("hk-b", 1100, 470, 520, 120, "Câu hỏi tiếp theo", "violet"),
        el("hk-note", 0, 650, 1920, None, "Kể tốt là dẫn dắt buổi phỏng vấn về phần mình mạnh", "note r"),
        tile("hk-tile", 300, 350, 220, "quote"),
        el("hk-word", 570, 380, 1300, None, letters("Project Story & STAR"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "giới thiệu dự án · STAR · behavioral · câu hỏi ngược", "kin-sub r"),
        wires(trace("hk-w", [(820, 530), (1100, 530)], "cyan")),
    ]), beats=[
        ("Giới thiệu dự án gần nhất của em. Với hai năm kinh nghiệm, câu này gần như luôn được hỏi.",
         "“Giới thiệu dự án gần nhất của em”: câu gần như luôn được hỏi.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Người phỏng vấn dùng chính câu trả lời đó để chọn câu hỏi tiếp theo. Kể tốt, bạn dẫn dắt được buổi phỏng vấn.",
         "Câu trả lời của bạn quyết định câu hỏi tiếp theo.",
         [IN("#hk-a", "pop", 0.3), DRAW("#hk-w-p", 1.6, 0.5), COMET("hk-w", 2.1, 0.6), IN("#hk-b", "pop", 2.6), LIGHT("#hk-b", 2.8),
          IN("#hk-note", "up", 5.0)]),
        ("Hôm nay: kể dự án, và phương pháp Star.", "Hôm nay: Project Story & STAR.",
         [OUT("#hk-eye, #hk-q, #hk-a, #hk-b, #hk-w, #hk-note", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7),
          TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ intro: the 1-2 minute project introduction
    dict(id="intro", world=(1920, 1080), hud=hud("in", "Giới thiệu dự án", "1–2 phút, năm phần theo thứ tự"), cam="".join([
        big_title("in", "Giới thiệu dự án", "1–2 phút, năm phần theo thứ tự"),
        el("in-q", 160, 170, 1600, None, "Họ muốn biết: dự án khó cỡ nào · em làm gì · em hiểu sâu tới đâu", "note left r"),
        intro_nodes(),
        wires(*[trace(f"in-w{i}", [(410 + i * 350, 305), (470 + i * 350, 305)], "cyan") for i in range(4)]),
        el("in-bait", 1450, 440, 360, None, "↑ mồi câu", "note green r"),
        box("in-bad", 160, 520, 1600, 80, "<b>✗ Một con số đẹp tự nghĩ ra: họ sẽ hỏi “đo bằng cách nào?”</b>", "red", "card"),
        box("in-good", 160, 620, 1600, 80, "<b>✓ “Theo dashboard Grafana lúc đó khoảng &lt;…&gt;” · không biết thì nói không biết</b>", "green", "card"),
        chip("in-t1", 160, 740, "Kể lan man mọi tính năng", "red"),
        chip("in-t2", 700, 740, "“Team em làm…” từ đầu tới cuối", "red"),
        chip("in-t3", 160, 820, "Lộ thông tin mật", "red"),
        chip("in-t4", 520, 820, "Nhắc Kafka mà không trả lời được partition", "red"),
    ]), beats=[
        ("Phần một: giới thiệu dự án trong một đến hai phút. Người phỏng vấn muốn biết: dự án khó cỡ nào, em làm gì, và em hiểu sâu tới đâu.",
         "Phần 1: dự án khó cỡ nào, em làm gì, em hiểu sâu tới đâu?",
         [TYPE("#in-big", 0.1, 0.06), IN("#in-bsub", "blur", 0.9), OUT("#in-big, #in-bsub", "zoom", 3.6), IN("#in-hud", "left", 4.2),
          IN("#in-q", "fade", 4.8)]),
        ("Kể theo năm phần: bối cảnh, quy mô, kiến trúc và stack, vai trò của em, rồi một điểm nhấn kỹ thuật.",
         "Năm phần: bối cảnh, quy mô, kiến trúc, vai trò, điểm nhấn.",
         [IN("#in-n0", "pop", 0.4), DRAW("#in-w0-p", 1.4, 0.3), IN("#in-n1", "pop", 1.6), DRAW("#in-w1-p", 2.4, 0.3), IN("#in-n2", "pop", 2.6),
          DRAW("#in-w2-p", 4.0, 0.3), IN("#in-n3", "pop", 4.2), DRAW("#in-w3-p", 5.2, 0.3), IN("#in-n4", "pop", 5.4)]),
        ("Quy mô chỉ nói số bạn chắc chắn biết. Vai trò thì nói em, đừng nói team em. Điểm nhấn chỉ nêu tên vấn đề rồi chờ họ hỏi: đó là mồi câu.",
         "Quy mô: số chắc chắn biết · vai trò: nói “em” · điểm nhấn: mồi câu.",
         [IN("#in-s0, #in-s1, #in-s2, #in-s3, #in-s4", "up", 0.3, 0.5, 0.15), LIGHT("#in-n1", 0.6), LIGHT("#in-n3", 3.2),
          LIGHT("#in-n4", 6.0), IN("#in-bait", "up", 7.6)]),
        ("Không nhớ chính xác quy mô? Đừng bịa, vì họ sẽ hỏi đo bằng cách nào. Hãy nói khoảng và nói nguồn, không biết thì nói không biết.",
         "Không nhớ số: nói khoảng và nói nguồn. Không biết thì nói không biết.",
         [IN("#in-bad", "left", 0.3), SHAKE("#in-bad", 1.6), IN("#in-good", "left", 4.2)]),
        ("Các bẫy khác: kể lan man mọi tính năng, nói team em suốt buổi, lộ thông tin mật, và nhắc Kafka mà không trả lời được partition.",
         "Bẫy: kể lan man, “team em”, lộ thông tin mật, đặt mồi chỗ mình không vững.",
         [IN("#in-t1", "pop", 0.5), IN("#in-t2", "pop", 2.4), IN("#in-t3", "pop", 4.2), IN("#in-t4", "pop", 5.8)]),
    ]),
    # ------------------------------------------------------------ star: the STAR method, weak vs strong
    dict(id="star", world=(1920, 1080), hud=hud("st", "Phương pháp STAR", "Action dài nhất"), cam="".join([
        big_title("st", "STAR", "Situation · Task · Action · Result"),
        box("st-s", 160, 190, 640, 76, "<b>Situation · bối cảnh ngắn</b>", "amber", "card"),
        box("st-t", 160, 280, 640, 76, "<b>Task · việc của em</b>", "amber", "card"),
        box("st-a", 160, 370, 1600, 76, "<b>Action · em làm gì, theo thứ tự, vì sao chọn cách đó</b>", "cyan", "card"),
        box("st-r", 160, 460, 900, 76, "<b>Result · kết quả đo được</b>", "green", "card"),
        box("st-l", 160, 550, 900, 76, "<b>+ Learning · sau đó em đổi cách làm gì</b>", "violet", "card"),
        el("st-wq", 160, 190, 1600, None, "Kể về một vấn đề hiệu năng em đã xử lý.", "lbl r", "text-align:left"),
        box("st-weak", 160, 250, 1600, 90, "<b>“API chậm, em phát hiện N+1 nên dùng JOIN FETCH, sau đó nhanh hơn nhiều.”</b>", "red", "card"),
        chip("st-f0", 160, 370, "✗ không bối cảnh", "red"), chip("st-f1", 530, 370, "✗ phát hiện bằng cách nào?", "red"),
        chip("st-f2", 1060, 370, "✗ không phương án khác", "red"),
        chip("st-f3", 160, 450, "✗ “nhanh hơn nhiều” không đo được", "red"), chip("st-f4", 800, 450, "✗ không bài học", "red"),
        gnode("st-g0", 160, 580, 340, 110, "Log SQL: 1 + N", "cyan"),
        gnode("st-g1", 580, 580, 380, 110, "Thử 3 cách", "cyan"),
        gnode("st-g2", 1040, 580, 300, 110, "Chọn, nêu lý do", "cyan"),
        gnode("st-g3", 1420, 580, 340, 110, "Test đếm SQL", "green"),
        el("st-opts", 440, 710, 680, None, "JOIN FETCH · @EntityGraph · batch size", "lbl r"),
        box("st-res", 160, 790, 1600, 76, "<b>R: số câu SQL từ 1 + N xuống &lt;số bạn đo&gt; · thời gian &lt;số bạn đo&gt;</b>", "green", "card"),
        wires(trace("st-w0", [(500, 635), (580, 635)], "cyan"), trace("st-w1", [(960, 635), (1040, 635)], "cyan"),
              trace("st-w2", [(1340, 635), (1420, 635)], "cyan")),
    ]), beats=[
        ("Phần hai: phương pháp Star. Câu hỏi hành vi dựa trên một giả định: cách em làm trong quá khứ dự đoán cách em sẽ làm.",
         "Phần 2: hành vi trong quá khứ dự đoán hành vi tương lai.",
         [TYPE("#st-big", 0.1, 0.08), IN("#st-bsub", "blur", 0.8), OUT("#st-big, #st-bsub", "zoom", 4.0), IN("#st-hud", "left", 4.6)]),
        ("Situation và Task chỉ cần ngắn. Action dài nhất: em đã làm gì, theo thứ tự nào, và vì sao chọn cách đó. Result vừa phải, và đo được.",
         "S và T ngắn. A dài nhất: làm gì, thứ tự nào, vì sao. R đo được.",
         [IN("#st-s", "left", 0.3), IN("#st-t", "left", 1.4), IN("#st-a", "left", 3.0, 0.8), PULSE("#st-a", 5.0), IN("#st-r", "left", 7.6)]),
        ("Thêm chữ L, bài học: sau chuyện đó em thay đổi cách làm gì. Với hai năm kinh nghiệm, phần này rất được đánh giá cao.",
         "Thêm L (Learning): sau chuyện đó em đổi cách làm gì.",
         [IN("#st-l", "left", 0.4)]),
        ("Nghe một câu trả lời yếu: API chậm, em phát hiện N cộng một nên dùng Join Fetch, sau đó nhanh hơn nhiều.",
         "Câu trả lời yếu: “API chậm, … dùng JOIN FETCH, nhanh hơn nhiều.”",
         [OUT("#st-s, #st-t, #st-a, #st-r, #st-l", "fade", 0, 0.4), IN("#st-wq", "fade", 0.5), IN("#st-weak", "left", 1.2)]),
        ("Nó thiếu bối cảnh, không nói phát hiện bằng cách nào, không có phương án khác, nhanh hơn nhiều thì không đo được, và không có bài học.",
         "Thiếu: bối cảnh · cách phát hiện · phương án khác · số đo · bài học.",
         [IN("#st-f0", "pop", 0.4), IN("#st-f1", "pop", 1.6), IN("#st-f2", "pop", 3.4), IN("#st-f3", "pop", 5.2), IN("#st-f4", "pop", 7.6)]),
        ("Bản mạnh dồn sức vào Action: bật log SQL, đếm được một cộng N câu. Thử Join Fetch, Entity Graph và batch size, rồi chọn một cách vì lý do cụ thể.",
         "Bản mạnh: bật log SQL đếm 1 + N câu, thử 3 cách, chọn vì lý do cụ thể.",
         [DIM("#st-weak, #st-f0, #st-f1, #st-f2, #st-f3, #st-f4, #st-wq", 0.2, 0.35), IN("#st-g0", "pop", 0.6), DRAW("#st-w0-p", 2.6, 0.3),
          IN("#st-g1", "pop", 2.9), IN("#st-opts", "up", 3.4), DRAW("#st-w1-p", 6.6, 0.3), IN("#st-g2", "pop", 6.9)]),
        ("Rồi viết test đếm số câu SQL để lỗi không quay lại. Kết quả là con số bạn thật sự đo, không phải số tự nghĩ ra.",
         "Viết test đếm câu SQL. Kết quả: số bạn thật sự đo.",
         [DRAW("#st-w2-p", 0.3, 0.3), IN("#st-g3", "pop", 0.6), LIGHT("#st-g3", 1.6), IN("#st-res", "up", 3.4)]),
        ("Chỉ thuộc khung và ý chính, đừng học thuộc từng chữ. Không có chuyện hợp câu hỏi thì nói thật, rồi kể chuyện gần nhất.",
         "Thuộc khung, không thuộc chữ. Không có chuyện hợp thì nói thật.",
         [PULSE("#st-a", 0.2), PULSE("#st-res", 3.0)]),
    ]),
    # ------------------------------------------------------------ behavioral: eight topics
    dict(id="behavioral", world=(1920, 1080), hud=hud("bh", "Tám chủ đề behavioral", "Mỗi chủ đề họ tìm một điều"), cam="".join([
        card4("bh-c", 160, 190, 380, 250, 26, [("split", "Bất đồng", "dữ liệu, chấp nhận quyết định chung"),
                                                ("grid", "Deadline gấp", "ưu tiên, báo sớm, không cắt test"),
                                                ("shield", "Mắc lỗi", "nhận trách nhiệm, nguyên nhân gốc"),
                                                ("tree", "Học nhanh", "tài liệu chính thức, PoC nhỏ")]),
        card4("bh-d", 160, 470, 380, 250, 26, [("plug", "Chủ động", "đo được giá trị, vẫn xin ý kiến"),
                                                ("share", "Giúp người khác", "giải thích thay vì làm hộ"),
                                                ("quote", "Feedback khó nghe", "không phòng thủ, đổi thật"),
                                                ("eq", "Chất lượng vs tốc độ", "nợ kỹ thuật có ý thức")], tone="violet"),
        el("bh-q", 160, 200, 1600, None, "“Kể về một sai lầm của em.”", "lbl r", "text-align:left"),
        box("bh-bad", 160, 270, 1600, 90, "<b>✗ “Em quá cầu toàn” · lỗi của đồng nghiệp · “chưa từng sai”</b>", "red", "card"),
        box("bh-good", 160, 390, 1600, 90, "<b>✓ Lỗi thật → cách xử lý → nguyên nhân gốc → quy trình đã đổi</b>", "green", "card"),
        chip("bh-never", 160, 760, "Không đánh đổi ở tiền, bảo mật, dữ liệu", "red"),
        chip("bh-each", 160, 540, "Mỗi chủ đề một câu chuyện STAR · chỉ trải nghiệm và số liệu thật", "amber"),
    ]), beats=[
        ("Phần ba: tám chủ đề hành vi hay gặp. Ở mỗi chủ đề, người phỏng vấn tìm một điều khác nhau.",
         "Phần 3: tám chủ đề behavioral, mỗi chủ đề họ tìm một điều.",
         [IN("#bh-hud", "left", 0.1)]),
        ("Bất đồng kỹ thuật: tranh luận bằng dữ liệu, rồi chấp nhận quyết định chung. Deadline gấp: biết ưu tiên, báo sớm, không âm thầm cắt test.",
         "Bất đồng: dùng dữ liệu, chấp nhận quyết định chung. Deadline: báo sớm.",
         [IN("#bh-c0", "pop", 0.3), IN("#bh-c1", "pop", 4.6)]),
        ("Mắc lỗi: nhận trách nhiệm, tìm nguyên nhân gốc, đổi quy trình. Học nhanh: đọc tài liệu chính thức, làm một bản thử nhỏ.",
         "Mắc lỗi: nhận trách nhiệm, nguyên nhân gốc. Học nhanh: tài liệu, PoC nhỏ.",
         [IN("#bh-c2", "pop", 0.3), IN("#bh-c3", "pop", 4.4)]),
        ("Chủ động cải thiện: đo được giá trị, nhưng vẫn xin ý kiến. Giúp người khác: giải thích, thay vì làm hộ.",
         "Chủ động: đo được giá trị, vẫn xin ý kiến. Giúp người: giải thích.",
         [IN("#bh-d0", "pop", 0.3), IN("#bh-d1", "pop", 3.8)]),
        ("Nhận góp ý khó nghe: không phòng thủ, và thay đổi thật. Đánh đổi chất lượng và tốc độ: nợ kỹ thuật có ý thức, nhưng không đánh đổi ở tiền, bảo mật và dữ liệu.",
         "Feedback: không phòng thủ. Đánh đổi: không ở tiền, bảo mật, dữ liệu.",
         [IN("#bh-d2", "pop", 0.3), IN("#bh-d3", "pop", 3.6), IN("#bh-never", "up", 7.4)]),
        ("Ví dụ, khi được hỏi về một sai lầm, đừng nói em quá cầu toàn. Hãy kể một lỗi thật, cách em xử lý, nguyên nhân gốc, và quy trình em đổi sau đó.",
         "Kể sai lầm: một lỗi thật và quy trình đã đổi, không “em quá cầu toàn”.",
         [OUT("#bh-c0, #bh-c1, #bh-c2, #bh-c3, #bh-d0, #bh-d1, #bh-d2, #bh-d3, #bh-never", "fade", 0, 0.4),
          IN("#bh-q", "fade", 0.5), IN("#bh-bad", "left", 1.2), SHAKE("#bh-bad", 2.6), IN("#bh-good", "left", 4.6)]),
        ("Mỗi chủ đề, viết sẵn một câu chuyện Star, chỉ dùng trải nghiệm và số liệu thật của bạn.",
         "Mỗi chủ đề một câu chuyện STAR, chỉ dùng trải nghiệm và số liệu thật.",
         [IN("#bh-each", "up", 0.4)]),
    ]),
    # ------------------------------------------------------------ labs: order-service labs as stories
    dict(id="labs", world=(1920, 1080), hud=hud("lb", "Lab thành câu chuyện", "Nói rõ đó là project cá nhân"), cam="".join([
        el("lb-open", 260, 300, 1400, None,
           "“Ở công ty em chưa gặp đúng vấn đề này ở quy mô lớn, nên em dựng một project cá nhân để tái hiện và đo.”",
           "answer-sub r", "text-align:center;line-height:1.5"),
        lab_rows(),
        gnode("lb-g0", 160, 230, 400, 110, "Test 2 thread", "cyan"),
        gnode("lb-g1", 640, 230, 360, 110, "Lost update", "red"),
        gnode("lb-g2", 1080, 230, 300, 110, "@Version", "violet"),
        el("lb-ex", 1000, 370, 760, None, "→ OptimisticLockException", "note left r", "font-family:var(--mono)"),
        box("lb-cmp", 160, 450, 1600, 80, "<b>So sánh với UPDATE có điều kiện stock &gt;= qty, kết luận bằng lý do của bạn</b>", "cyan", "card"),
        chip("lb-s0", 160, 600, "1. Lấy dòng Dự án trong nhật ký học tập", "violet"),
        chip("lb-s1", 160, 680, "2. Viết lại theo STAR, chỉ dùng số đã đo", "violet"),
        chip("lb-s2", 160, 760, "3. Nói to, bấm giờ khoảng 2 phút", "violet"),
        chip("lb-s3", 160, 840, "4. Chuẩn bị 2–3 câu hỏi xoáy", "violet"),
        el("lb-warn", 1000, 640, 760, None, "Đừng trình bày lab như production có hàng triệu user", "warnbox r"),
        wires(trace("lb-v0", [(560, 285), (640, 285)], "cyan"), trace("lb-v1", [(1000, 285), (1080, 285)], "violet")),
    ]), beats=[
        ("Phần bốn: biến lab order service thành câu chuyện. Lab là trải nghiệm thật: bạn đã tự tái hiện, đo, và sửa.",
         "Phần 4: lab order-service là trải nghiệm thật: tự tái hiện, đo, sửa.",
         [IN("#lb-hud", "left", 0.1)]),
        ("Câu mở thật thà: ở công ty em chưa gặp đúng vấn đề này ở quy mô lớn, nên em dựng một project cá nhân để tái hiện và đo.",
         "Câu mở: chưa gặp ở quy mô lớn, nên em dựng project cá nhân để đo.",
         [IN("#lb-open", "blur", 0.4, 0.8)]),
        ("N cộng một cho câu hỏi hiệu năng. Version cho concurrency. Index và Explain cho tối ưu query. Cache Redis cho trade-off.",
         "N+1: hiệu năng · @Version: concurrency · index: query · cache: trade-off.",
         [OUT("#lb-open", "blur", 0, 0.4)] + lab_in(0, 0.4) + lab_in(1, 2.4) + lab_in(2, 4.4) + lab_in(3, 6.8)),
        ("Token đăng nhập và phân quyền cho chuyện học nhanh. Lỗi Transactional cho chuyện mắc lỗi. Test Containers cho chủ động cải thiện.",
         "JWT: học nhanh · lỗi @Transactional: mắc lỗi · Testcontainers: chủ động.",
         lab_in(4, 0.3) + lab_in(5, 3.6) + lab_in(6, 6.4)),
        ("Ví dụ chuyện concurrency: test hai thread cùng trừ kho lộ ra một lần cập nhật bị mất. Thêm Version thì một thread nhận Optimistic Lock Exception.",
         "2 thread cùng trừ kho: mất một lần cập nhật. @Version: OptimisticLockException.",
         [OUT(", ".join(f"#lb-l{i}, #lb-t{i}, #lb-w{i}" for i in range(7)), "fade", 0, 0.4),
          IN("#lb-g0", "pop", 0.6), DRAW("#lb-v0-p", 2.4, 0.3), IN("#lb-g1", "pop", 2.7), SHAKE("#lb-g1", 3.4),
          DRAW("#lb-v1-p", 5.2, 0.3), IN("#lb-g2", "pop", 5.5), LIGHT("#lb-g2", 6.0), IN("#lb-ex", "up", 7.0)]),
        ("Rồi so sánh với câu update có điều kiện, và kết luận bằng lý do của chính bạn.",
         "So sánh với UPDATE có điều kiện, kết luận bằng lý do của bạn.",
         [IN("#lb-cmp", "up", 0.4)]),
        ("Cách viết: lấy dòng dự án trong nhật ký học tập, viết lại theo Star, chỉ dùng số đã đo, nói to và bấm giờ khoảng hai phút.",
         "Từ nhật ký: viết theo STAR, chỉ dùng số đã đo, bấm giờ khoảng 2 phút.",
         [IN("#lb-s0", "left", 0.3), IN("#lb-s1", "left", 2.6), IN("#lb-s2", "left", 5.6)]),
        ("Chuẩn bị hai ba câu hỏi xoáy cho mỗi chuyện. Và đừng trình bày lab như hệ thống production có hàng triệu người dùng.",
         "Chuẩn bị 2–3 câu hỏi xoáy. Đừng trình bày lab như production.",
         [IN("#lb-s3", "left", 0.3), IN("#lb-warn", "up", 2.8)]),
    ]),
    # ------------------------------------------------------------ reverse: questions for the interviewer + checklist
    dict(id="reverse", world=(1920, 1080), hud=hud("rv", "Câu hỏi ngược và checklist", "Chuẩn bị 5–6 câu, chọn 2–3"), cam="".join([
        el("rv-h1", 160, 180, 860, None, "Nên hỏi", "lbl r", "text-align:left;color:var(--green)"),
        chip("rv-q0", 160, 240, "Một ngày làm việc điển hình?", "green"),
        chip("rv-q1", 160, 320, "Kỳ vọng trong 3 tháng đầu?", "green"),
        chip("rv-q2", 160, 400, "Thách thức kỹ thuật lớn nhất?", "green"),
        chip("rv-q3", 160, 480, "Review, test, deploy thế nào?", "green"),
        chip("rv-q4", 160, 560, "Xử lý sự cố production ra sao?", "green"),
        el("rv-h2", 1080, 180, 680, None, "Tránh", "lbl r", "text-align:left;color:var(--red)"),
        chip("rv-x0", 1080, 240, "Điều có sẵn trên website", "red"),
        chip("rv-x1", 1080, 320, "Lương, ngày nghỉ ở vòng kỹ thuật", "red"),
        chip("rv-x2", 1080, 400, "“Em không có câu hỏi”", "red"),
        card4("rv-k", 160, 190, 380, 230, 26, [("quote", "Giới thiệu", "1 phút bản thân, 2 phút dự án, ghi âm"),
                                                ("box", "8 câu chuyện", "có số liệu thật"),
                                                ("grid", "Đọc JD", "1 ví dụ cho mỗi công nghệ"),
                                                ("tree", "System design", "luyện một đề")]),
        el("rv-h3", 160, 480, 1600, None, "Trong lúc trả lời", "lbl r", "text-align:left"),
        chip("rv-a0", 160, 540, "Không hiểu thì hỏi lại, đừng đoán", "cyan"),
        chip("rv-a1", 160, 620, "Không biết: “em chưa làm, nhưng em hiểu là…”, suy luận thành tiếng", "cyan"),
        chip("rv-a2", 160, 700, "Ý chính trước, chi tiết sau, ví dụ dự án cuối", "cyan"),
        chip("rv-a3", 160, 800, "Sau buổi: ghi ngay câu trả lời chưa tốt", "amber"),
    ]), beats=[
        ("Phần năm: câu hỏi ngược. Chuẩn bị năm sáu câu, và chọn hai ba câu tùy người phỏng vấn.",
         "Phần 5: chuẩn bị 5–6 câu hỏi ngược, chọn 2–3.",
         [IN("#rv-hud", "left", 0.1), IN("#rv-h1", "fade", 2.0), IN("#rv-h2", "fade", 2.4)]),
        ("Hỏi về công việc: một ngày điển hình, kỳ vọng ba tháng đầu. Hỏi về kỹ thuật: thách thức lớn nhất, cách review, test, deploy, và cách xử lý sự cố production.",
         "Một ngày điển hình · 3 tháng đầu · thách thức kỹ thuật · review, deploy, sự cố.",
         [IN("#rv-q0", "left", 0.3), IN("#rv-q1", "left", 2.2), IN("#rv-q2", "left", 4.6), IN("#rv-q3", "left", 6.6), IN("#rv-q4", "left", 8.6)]),
        ("Tránh hỏi điều có sẵn trên website. Tránh hỏi lương và ngày nghỉ ở vòng kỹ thuật. Và đừng bao giờ nói em không có câu hỏi.",
         "Tránh: điều có trên website, lương ở vòng kỹ thuật, “em không có câu hỏi”.",
         [IN("#rv-x0", "right", 0.3), IN("#rv-x1", "right", 2.6), IN("#rv-x2", "right", 5.6), SHAKE("#rv-x2", 6.4)]),
        ("Tuần cuối: tập giới thiệu bản thân một phút, dự án hai phút, ghi âm rồi nghe lại. Tám câu chuyện có số thật. Đọc lại mô tả công việc, và luyện một đề system design.",
         "Tuần cuối: ghi âm phần giới thiệu, 8 câu chuyện số thật, đọc JD, system design.",
         [OUT("#rv-h1, #rv-h2, #rv-q0, #rv-q1, #rv-q2, #rv-q3, #rv-q4, #rv-x0, #rv-x1, #rv-x2", "fade", 0, 0.4),
          IN("#rv-k0", "pop", 0.6), IN("#rv-k1", "pop", 5.0), IN("#rv-k2", "pop", 6.8), IN("#rv-k3", "pop", 8.8)]),
        ("Trong lúc trả lời: không hiểu thì hỏi lại. Không biết thì suy luận thành tiếng. Ý chính trước, chi tiết sau, ví dụ dự án ở cuối.",
         "Không hiểu: hỏi lại · không biết: suy luận thành tiếng · ý chính trước.",
         [IN("#rv-h3", "fade", 0.2), IN("#rv-a0", "left", 0.4), IN("#rv-a1", "left", 2.2), IN("#rv-a2", "left", 4.6)]),
        ("Sau buổi phỏng vấn, ghi ngay những câu trả lời chưa tốt.", "Sau buổi phỏng vấn: ghi ngay câu trả lời chưa tốt.",
         [IN("#rv-a3", "up", 0.3)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("tree", "Giới thiệu dự án", "5 phần, đặt mồi câu"),
                                                ("grid", "STAR", "Action dài nhất"),
                                                ("shield", "Số liệu thật", "đã đo, không bịa"),
                                                ("quote", "Câu hỏi ngược", "luôn có 2–3 câu")]),
        chip("ou-next", 720, 650, "Bài tiếp: Lab 1 Collections", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để dựng câu chuyện STAR của riêng bạn", "cta r"),
    ]), beats=[
        ("Tóm lại: giới thiệu dự án theo năm phần, có mồi câu. Star với phần Action dài nhất. Chỉ dùng số liệu đã đo. Và luôn có câu hỏi ngược.",
         "5 phần có mồi câu · Action dài nhất · số liệu đã đo · luôn có câu hỏi ngược.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.4), IN("#ou-c2", "pop", 5.6), IN("#ou-c3", "pop", 7.6)]),
        ("Bài tiếp: lab một, Collections.", "Bài tiếp: Lab 1 Collections.",
         [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để dựng câu chuyện Star của riêng bạn nhé.",
         "Mở bài học tương tác để dựng câu chuyện STAR của riêng bạn nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
