"""OOP explainer: scene layouts (1920x1080 world coordinates) and per-beat narration + motion."""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

FOUR = [("lock", "Encapsulation", "Đóng gói"), ("tree", "Inheritance", "Kế thừa"),
        ("shapes", "Polymorphism", "Đa hình"), ("plug", "Abstraction", "Trừu tượng")]

# ---------------------------------------------------------------- helpers for the Abstraction / Interface vs Abstract / Pass-by-value scenes

def v_when(spoken, phrase):
    """Seconds into the narration (at ~14.5 chars/s) where `phrase` starts; fit_to_audio rescales to the real take."""
    return round(spoken.index(phrase) / 14.5, 2)


def VB(spoken, caption, fn):
    """A beat whose actions are built from the sentence, so reveals land on the words they illustrate."""
    return (spoken, caption, fn(lambda p: v_when(spoken, p)))


def vS(*names):
    return ", ".join("#" + n for n in names)


def vAR(*names):
    return ", ".join(f"#{n}, #{n}-h" for n in names)


def v_head(p, eyebrow, title, size=80):
    """Scene opener: eyebrow + large headline top centre, shrunk by v_shrink once the content comes in."""
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def v_shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def v_panel(id_, x=70, y=190, w=1780, h=750):
    """Large dark glass card that holds the scene content."""
    return el(id_, x, y, w, h, "", "gbox muted panel r")


def v_code(src, size=32):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def v_cbox(id_, x, y, w, title, src, tone="violet", size=32):
    bar = win(title) if title else ""
    return box(id_, x, y, w, None, bar + v_code(src, size), tone, "code")


def v_tag(id_, x, y, w, h, text, tone="cyan", size=40):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600">{esc(text)}</span>', tone)


def v_card(id_, x, y, w, h, top, sub, tone="cyan", ts=56, ss=32, ico=None):
    inner = icon(ico, 96) if ico else ""
    inner += f'<b style="font-size:{ts}px;letter-spacing:-0.02em">{esc(top)}</b>'
    inner += f'<span style="font-size:{ss}px;color:var(--muted);text-align:center">{esc(sub)}</span>'
    return box(id_, x, y, w, h, inner, tone, "card")


def v_mono(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=44, dash=False):
    inner = f'<span class="mono" style="font-size:26px;color:var(--muted)">{top}</span>' if top else ""
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700">{main}</span>'
    inner += f'<span class="mono" style="font-size:26px;color:var(--muted)">{sub}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col dash" if dash else "col")


def v_err(id_, x, y, w, text, size=27):
    return el(id_, x, y, w, None, esc(text), "err r", f"font-size:{size}px")


def v_con(id_, x, y, w, lines, size=40):
    """Console whose lines (ids <id>-1..n) are typed in one by one."""
    rows = "".join(f'<i id="{id_}-{i}" style="font-size:{size}px">{esc(l)}</i>' for i, l in enumerate(lines, 1))
    return el(id_, x, y, w, None, f"<span>console</span>{rows}", "console")


def v_var(id_, x, y, w, h, label, ref, tone, ref_tone):
    return box(id_, x, y, w, h,
               f'<span class="mono" style="font-size:38px">{label}</span>'
               f'<span class="chip {ref_tone}" style="font-size:34px">@{ref}</span>', tone, "row")


def v_obj(id_, x, y, w, h, ref, text, tone, ref_tone, dash=False):
    return box(id_, x, y, w, h,
               f'<span class="chip {ref_tone}" style="font-size:34px">@{ref}</span>'
               f'<span class="mono" style="font-size:36px">{text}</span>', tone, "row dash" if dash else "row")


def v_cls(id_, x, y, w, h, name, members, tone):
    inner = f'<span class="mono" style="font-size:60px;font-weight:700">{name}</span>'
    inner += f'<span class="mono" style="font-size:34px;color:var(--muted)">{members}</span>'
    return box(id_, x, y, w, h, inner, tone, "col")


def e_con(id_, x, y, w, lines, size=44):
    return v_con(id_, x, y, w, lines, size).replace("<span>console</span>", '<span style="font-size:26px">console</span>', 1)


# ---------------------------------------------------------------- scenes

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        v_head("hk", "Câu hỏi phỏng vấn Java #1", "4 tính chất của OOP là gì?", 104),
        *[v_card(f"hk-c{i}", 70 + i * 453, 400, 420, 500, en, vi, "cyan", 46, 36, ico) for i, (ico, en, vi) in enumerate(FOUR)],
        v_card("hk-p1", 100, 400, 760, 400, "Trả lời thuộc lòng", "4 tên gọi, 4 định nghĩa", "amber", 52, 36),
        v_card("hk-p2", 1060, 400, 760, 400, "Bị hỏi xoáy ngay câu sau", "tại sao? khác gì? khi nào dùng?", "red", 52, 34),
        wires(arrow("hk-a1", [(870, 600), (1050, 600)], "muted")),
    ]), beats=[
        VB("Bốn tính chất của lập trình hướng đối tượng là gì?", "4 tính chất của lập trình hướng đối tượng (OOP) là gì?",
           lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.2, 0.05)]),
        VB("Đây gần như là câu mở màn của mọi buổi phỏng vấn Java.", "Đây gần như là câu mở màn của mọi buổi phỏng vấn Java.",
           lambda w: [IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 0.5, 0.55, 0.3)]),
        VB("Trả lời thuộc lòng thì dễ, nhưng người phỏng vấn sẽ hỏi xoáy ngay câu tiếp theo.", "Trả lời thuộc lòng thì dễ, nhưng người phỏng vấn sẽ hỏi xoáy ngay câu tiếp theo.",
           lambda w: [OUT("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "fade", 0, 0.4), IN("#hk-p1", "left", 0.6), *ARROW("hk-a1", w("nhưng") , 0.5),
                      IN("#hk-p2", "pop", w("sẽ hỏi xoáy")), SHAKE("#hk-p2", w("sẽ hỏi xoáy") + 0.6)]),
        VB("Hôm nay ta sẽ hiểu bản chất từng tính chất, kèm ví dụ code đã chạy thật, rồi nâng lên mức senior.", "Hôm nay ta hiểu bản chất từng tính chất, kèm ví dụ code đã chạy thật, rồi nâng lên mức senior.",
           lambda w: [OUT("#hk-p1, #hk-p2, #hk-a1, #hk-a1-h", "blur", 0, 0.5),
                      IN("#hk-c0, #hk-c1, #hk-c2, #hk-c3", "pop", 0.7, 0.55, 0.25),
                      PULSE("#hk-c0", w("bản chất")), PULSE("#hk-c1", w("kèm ví dụ")), PULSE("#hk-c2", w("đã chạy thật")), PULSE("#hk-c3", w("senior"))]),
    ]),
    # ------------------------------------------------------------ encapsulation
    dict(id="enc", world=(1920, 1080), hud="", cam="".join([
        v_head("en", "Phần 1 · Encapsulation", "Giấu dữ liệu, mở hành động"),
        v_panel("en-pn"),
        v_card("en-k1", 130, 330, 760, 360, "Giấu", "dữ liệu: private", "muted", 60, 36),
        v_card("en-k2", 1030, 330, 760, 360, "Mở", "hành động: deposit, withdraw", "green", 60, 34),
        box("en-bal", 640, 270, 640, 430,
            icon("lock", 96) + '<span class="mono" style="font-size:32px;color:var(--muted)">BankAccount</span>'
            '<span class="mono" style="font-size:44px">private balance</span>'
            '<span class="mono" style="font-size:110px;font-weight:700;color:var(--cyan)">100</span>', "cyan", "card"),
        v_cbox("en-atk", 1000, 330, 800, None, "account.balance = -1000;", "red", 40),
        v_err("en-err0", 1000, 500, 800, "✕ nếu public: ai cũng gán được số âm", 30),
        v_tag("en-dep", 110, 740, 310, 110, "deposit()", "green", 44),
        v_tag("en-wd", 440, 740, 310, 110, "withdraw()", "green", 44),
        v_cbox("en-code", 800, 270, 1000, "BankAccount.java",
               "public void withdraw(long amount) {\n    if (amount > balance)\n        throw new IllegalStateException(\n"
               "            \"insufficient balance\");\n    balance -= amount;\n}", "violet", 38),
        v_tag("en-tok", 800, 745, 430, 100, "withdraw(500)", "amber", 44),
        v_err("en-err", 800, 862, 1000, "✕ IllegalStateException: insufficient balance", 30),
        el("en-keep", 110, 880, 640, None, "balance vẫn = 100 ✓", "note green r", "font-size:36px"),
        el("en-t1", 0, 340, 1920, None, '<span class="strike-txt">Đóng gói ≠ getter/setter cho mọi field</span>', "take-sm r"),
        el("en-t2", 0, 450, 1920, None, letters("Đóng gói = bảo vệ quy tắc của dữ liệu"), "take r"),
        wires(arrow("en-a1", [(990, 470), (760, 470)], "red", True)),
    ]), beats=[
        VB("Thứ nhất: tính đóng gói. Giấu dữ liệu bên trong đối tượng.", "Thứ nhất: Encapsulation (đóng gói). Giấu dữ liệu bên trong object.",
           lambda w: [IN("#en-eye", "blur"), TYPE("#en-q", 0.2, 0.05), *v_shrink("en", 1.2), IN("#en-pn", "fade", 1.6, 0.6),
                      IN("#en-k1", "left", w("Giấu dữ liệu")), IN("#en-k2", "right", w("Giấu dữ liệu") + 1.2)]),
        VB("Lấy ví dụ một tài khoản ngân hàng. Số dư được khai báo private.", "Ví dụ tài khoản ngân hàng: số dư `balance` được khai báo private.",
           lambda w: [OUT("#en-k1, #en-k2", "blur", 0, 0.5), IN("#en-bal", "zoomin", 0.7, 0.7), PULSE("#en-bal", w("private"))]),
        VB("Nếu số dư là public, bất kỳ ai cũng có thể gán nó bằng âm một nghìn.", "Nếu balance là public, bất kỳ ai cũng có thể gán nó bằng -1000.",
           lambda w: [TO("#en-bal", {"x": -530}, 0.1, 0.7), IN("#en-atk", "right", w("bất kỳ ai")), *ARROW("en-a1", w("bất kỳ ai") + 0.5, 0.6), PULSE("#en-bal", w("âm một nghìn")),
                      IN("#en-err0", "up", w("âm một nghìn")), SHAKE("#en-err0", w("âm một nghìn") + 0.5)]),
        VB("Vì vậy ta chỉ mở ra hai hành động: nạp tiền và rút tiền. Hành động nào cũng kiểm tra quy tắc.", "Vì vậy chỉ mở ra 2 hành động: deposit và withdraw. Cái nào cũng kiểm tra quy tắc.",
           lambda w: [OUT("#en-atk, #en-err0, #en-a1, #en-a1-h", "blur", 0, 0.5), IN("#en-dep", "up", w("nạp tiền")), IN("#en-wd", "up", w("rút tiền")), PULSE("#en-dep, #en-wd", w("Hành động nào")),
                      IN("#en-code", "right", w("Hành động nào"), 0.7)]),
        VB("Rút năm trăm khi chỉ có một trăm? Ném lỗi, và số dư vẫn giữ nguyên một trăm.", "Rút 500 khi chỉ có 100? Ném lỗi, và số dư vẫn giữ nguyên 100.",
           lambda w: [IN("#en-tok", "pop", 0.2), PULSE("#en-code", w("Ném lỗi") - 0.3), PULSE("#en-wd", w("Ném lỗi")),
                      IN("#en-err", "up", w("Ném lỗi")), SHAKE("#en-err", w("Ném lỗi") + 0.4), PULSE("#en-bal", w("số dư vẫn")), IN("#en-keep", "up", w("số dư vẫn"))]),
        VB("Đóng gói không phải là viết getter, setter cho mọi field. Nó là bảo vệ quy tắc của dữ liệu.", "Đóng gói không phải viết getter/setter cho mọi field. Nó là bảo vệ quy tắc của dữ liệu.",
           lambda w: [OUT("#en-bal, #en-dep, #en-wd, #en-code, #en-tok, #en-err, #en-keep", "blur", 0, 0.5),
                      IN("#en-t1", "blur", 0.7), TYPE("#en-t2", w("Nó là"), 0.03)]),
    ]),
    # ------------------------------------------------------------ inheritance basics
    dict(id="ibas", world=(1920, 1080), hud="", cam="".join([
        v_head("ib", "Phần 2 · Kế thừa là gì", "extends, override, super"),
        v_panel("ib-pn"),
        v_card("ib-w1", 100, 320, 540, 440, "extends", "Dog kế thừa Animal", "cyan", 60, 34),
        v_card("ib-w2", 690, 320, 540, 440, "override", "viết đè method của cha", "green", 60, 34),
        v_card("ib-w3", 1280, 320, 540, 440, "super", "gọi lại bản của cha", "violet", 60, 34),
        v_cls("ib-an", 110, 290, 760, 230, "Animal", "eat()   speak()", "cyan"),
        v_cls("ib-dog", 110, 640, 760, 230, "Dog", "bark()", "green"),
        el("ib-ext", 520, 560, 200, None, "extends", "lbl r", "font-size:34px"),
        v_card("ib-inh", 1010, 290, 800, 580, "eat()", "có sẵn từ Animal, không phải chép code", "green", 72, 36),
        v_cbox("ib-code", 100, 270, 960, "Dog.java",
               "class Dog extends Animal {\n    @Override\n    void speak() {\n        super.speak();\n"
               "        System.out.println(\"Gâu\");\n    }\n}", "violet", 40),
        v_tag("ib-s1", 1110, 320, 700, 150, "Animal.speak() → ...", "cyan", 40),
        v_tag("ib-s2", 1110, 520, 700, 150, "Dog.speak() → Gâu", "green", 40),
        e_con("ib-con", 1110, 290, 700, ["> ...", "> Gâu"], 44),
        v_tag("ib-sup", 1110, 600, 700, 150, "super.speak() = bản của cha", "amber", 38),
        v_card("ib-yes", 110, 280, 800, 560, "Dog là một Animal", "is-a: kế thừa bằng extends", "green", 64, 38),
        v_card("ib-no", 1010, 280, 800, 560, "Car có một Engine", "has-a: giữ một field Engine", "amber", 64, 38),
        el("ib-t1", 0, 400, 1920, None, letters("Là một thì kế thừa"), "take r"),
        el("ib-t2", 0, 540, 1920, None, "Có một thì giữ trong field", "take-sm r"),
        wires(arrow("ib-a1", [(490, 640), (490, 525)], "cyan")),
    ]), beats=[
        VB("Trước khi nói về cái giá của kế thừa, hãy hiểu kế thừa là gì.", "Trước khi nói về cái giá của kế thừa, hãy hiểu kế thừa là gì.",
           lambda w: [IN("#ib-eye", "blur"), TYPE("#ib-q", 0.2, 0.05), *v_shrink("ib", 1.2), IN("#ib-pn", "fade", 1.6, 0.6),
                      IN("#ib-w1", "up", 1.9), IN("#ib-w2", "up", 2.4), IN("#ib-w3", "up", 2.9)]),
        VB("Giả sử Animal biết ăn. Dog cũng muốn biết ăn, và thêm được tiếng sủa. Thay vì chép code, ta cho Dog kế thừa Animal, và Dog có sẵn mọi thứ của lớp cha.",
           "Animal biết eat(). Dog extends Animal nên có sẵn eat(), chỉ viết thêm bark().",
           lambda w: [OUT("#ib-w1, #ib-w2, #ib-w3", "blur", 0, 0.5), IN("#ib-an", "down", w("Giả sử")), IN("#ib-dog", "up", w("Dog cũng")),
                      *ARROW("ib-a1", w("ta cho Dog"), 0.5), IN("#ib-ext", "blur", w("ta cho Dog") + 0.6),
                      IN("#ib-inh", "right", w("có sẵn")), PULSE("#ib-dog", w("mọi thứ"))]),
        VB("Lớp con còn viết đè được method của cha. Animal speak thì in ba chấm. Dog viết đè speak để in Gâu.",
           "Class con có thể override method của cha: Animal.speak() in \"...\", Dog override để in \"Gâu\".",
           lambda w: [OUT("#ib-an, #ib-dog, #ib-ext, #ib-inh, #ib-a1, #ib-a1-h", "blur", 0, 0.5), IN("#ib-code", "left", 0.6, 0.7),
                      IN("#ib-s1", "right", w("Animal speak")), IN("#ib-s2", "right", w("Dog viết đè")), PULSE("#ib-code", w("Dog viết đè"))]),
        VB("Bên trong, super speak nghĩa là gọi lại bản của cha. Nên khi chạy, ba chấm in ra trước, rồi mới tới Gâu.",
           "super.speak() gọi lại bản của cha. Chạy: in \"...\" trước, rồi mới tới \"Gâu\".",
           lambda w: [OUT("#ib-s1, #ib-s2", "blur", 0, 0.5), IN("#ib-sup", "right", 0.6), IN("#ib-con", "up", w("Nên khi chạy")),
                      IN("#ib-con-1", "type1", w("ba chấm in ra"), 0.3), IN("#ib-con-2", "type1", w("rồi mới tới"), 0.3)]),
        VB("Trước khi kế thừa, hãy hỏi: câu X là một Y có đúng không? Chó là một động vật thì đúng. Còn xe có một động cơ, thì chỉ cần giữ động cơ trong field.",
           "Hỏi trước: \"X là một Y\" có đúng không? Dog là một Animal ✓. Car có một Engine → giữ field, không extends.",
           lambda w: [OUT("#ib-code, #ib-con, #ib-sup", "blur", 0, 0.5), IN("#ib-yes", "left", w("Chó là một")), PULSE("#ib-yes", w("thì đúng")),
                      IN("#ib-no", "right", w("Còn xe")), PULSE("#ib-no", w("chỉ cần giữ"))]),
        VB("Nhớ nhé: là một thì kế thừa, có một thì giữ trong field.", "Nhớ: \"là một\" → kế thừa. \"có một\" → giữ trong field.",
           lambda w: [OUT("#ib-yes, #ib-no", "blur", 0, 0.5), TYPE("#ib-t1", 0.7, 0.04), IN("#ib-t2", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ inheritance
    dict(id="inh", world=(1920, 1080), hud="", cam="".join([
        v_head("ih", "Phần 3 · Inheritance", "Cái giá của kế thừa"),
        v_panel("ih-pn"),
        v_card("ih-k1", 130, 330, 760, 360, "Tái sử dụng code", "lớp con dùng lại lớp cha", "green", 56, 34),
        v_card("ih-k2", 1030, 330, 760, 360, "Quan hệ là một", "is-a", "cyan", 56, 36),
        v_mono("ih-an", 560, 250, 800, 160, "", "Animal", "", "cyan", 60),
        v_mono("ih-dog", 160, 590, 600, 180, "", "Dog", "", "green", 60),
        v_mono("ih-cat", 1160, 590, 600, 180, "", "Cat", "", "green", 60),
        el("ih-l1", 300, 470, 200, None, "là một", "lbl r", "font-size:34px"),
        el("ih-l2", 1400, 470, 200, None, "là một", "lbl r", "font-size:34px"),
        el("ih-warn", 210, 830, 1500, None, "⚠ Lớp con phụ thuộc cả chi tiết bên trong của lớp cha", "warnbox r", "font-size:38px;text-align:center"),
        v_mono("ih-hs", 110, 260, 760, 130, "", "HashSet", "", "cyan", 52),
        v_mono("ih-ins", 110, 470, 760, 140, "", "InstrumentedHashSet", "", "violet", 44),
        el("ih-ext", 500, 405, 200, None, "extends", "lbl r", "font-size:34px"),
        v_tag("ih-ka", 110, 680, 220, 110, '"a"', "cyan", 48), v_tag("ih-kb", 370, 680, 220, 110, '"b"', "cyan", 48), v_tag("ih-kc", 630, 680, 220, 110, '"c"', "cyan", 48),
        el("ih-cd", 960, 250, 850, 600, "", "gbox muted r"),
        el("ih-cl", 960, 290, 850, None, "addCount", "counter-lbl r", "font-size:40px"),
        el("ih-cnt", 960, 360, 850, 340, "".join(f'<i id="ih-n{n}" style="font-size:330px;line-height:340px">{n}</i>' for n in (0, 3, 4, 5, 6)), "counter"),
        el("ih-exp", 960, 730, 850, None, "mong đợi: 3", "note r", "font-size:44px"),
        v_tag("ih-f1", 100, 290, 500, 130, "addAll(a, b, c)", "cyan", 40),
        v_tag("ih-f2", 710, 290, 500, 130, "super.addAll()", "cyan", 40),
        v_tag("ih-f3", 1320, 290, 500, 130, "add() ×3 (override)", "red", 38),
        v_card("ih-rs", 100, 540, 1100, 320, "mỗi phần tử bị đếm 2 lần", "addCount = 6 thay vì 3", "red", 52, 40),
        v_tag("ih-p1", 1300, 540, 150, 160, "+1", "red", 64), v_tag("ih-p2", 1475, 540, 150, 160, "+1", "red", 64), v_tag("ih-p3", 1650, 540, 150, 160, "+1", "red", 64),
        el("ih-t1", 0, 400, 1920, None, letters("Ưu tiên composition"), "take r"),
        el("ih-t2", 0, 540, 1920, None, "Chỉ kế thừa khi đúng quan hệ is-a", "take-sm r"),
        wires(arrow("ih-a1", [(460, 590), (720, 412)], "cyan"), arrow("ih-a2", [(1460, 590), (1200, 412)], "cyan"),
              arrow("ih-a3", [(490, 470), (490, 395)], "violet"),
              arrow("ih-a4", [(610, 355), (700, 355)], "muted"), arrow("ih-a5", [(1220, 355), (1310, 355)], "muted")),
    ]), beats=[
        VB("Thứ hai: kế thừa. Lớp con tái sử dụng code của lớp cha, theo quan hệ là một.", "Thứ hai: Inheritance (kế thừa). Lớp con tái sử dụng code của lớp cha, theo quan hệ is-a.",
           lambda w: [IN("#ih-eye", "blur"), TYPE("#ih-q", 0.2, 0.05), *v_shrink("ih", 1.2), IN("#ih-pn", "fade", 1.6, 0.6),
                      IN("#ih-k1", "left", w("Lớp con")), IN("#ih-k2", "right", w("theo quan hệ"))]),
        VB("Chó là một động vật. Mèo là một động vật.", "Dog là một Animal. Cat là một Animal.",
           lambda w: [OUT("#ih-k1, #ih-k2", "blur", 0, 0.5), IN("#ih-an", "pop", 0.6), IN("#ih-dog", "up", 0.9), *ARROW("ih-a1", 1.2, 0.5), IN("#ih-l1", "blur", 1.6),
                      IN("#ih-cat", "up", w("Mèo")), *ARROW("ih-a2", w("Mèo") + 0.3, 0.5), IN("#ih-l2", "blur", w("Mèo") + 0.8)]),
        VB("Nhưng kế thừa ràng buộc rất chặt. Lớp con phụ thuộc cả chi tiết bên trong của lớp cha.", "Nhưng kế thừa ràng buộc rất chặt: lớp con phụ thuộc cả chi tiết bên trong của lớp cha.",
           lambda w: [TO("#ih-a1-p", {"stroke": "#f5a524"}, w("ràng buộc"), 0.4), TO("#ih-a1-h", {"fill": "#f5a524"}, w("ràng buộc"), 0.4),
                      TO("#ih-a2-p", {"stroke": "#f5a524"}, w("ràng buộc"), 0.4), TO("#ih-a2-h", {"fill": "#f5a524"}, w("ràng buộc"), 0.4),
                      IN("#ih-warn", "up", w("Lớp con phụ thuộc")), PULSE("#ih-dog", w("chi tiết bên trong")), PULSE("#ih-cat", w("chi tiết bên trong"))]),
        VB("Ví dụ kinh điển: kế thừa HashSet để đếm số phần tử được thêm vào. Thêm ba phần tử, kết quả lại ra sáu.", "Ví dụ kinh điển: kế thừa HashSet để đếm phần tử được thêm. Thêm 3 phần tử, kết quả lại ra 6.",
           lambda w: [OUT("#ih-an, #ih-dog, #ih-cat, #ih-l1, #ih-l2, #ih-warn, #ih-a1, #ih-a1-h, #ih-a2, #ih-a2-h", "blur", 0, 0.5),
                      IN("#ih-hs", "down", 0.6), IN("#ih-ins", "up", 0.9), *ARROW("ih-a3", 1.2, 0.5), IN("#ih-ext", "blur", 1.6),
                      IN("#ih-cd", "fade", w("đếm số"), 0.5), IN("#ih-cl", "blur", w("đếm số")), IN("#ih-n0", "pop", w("đếm số") + 0.2),
                      IN("#ih-ka, #ih-kb, #ih-kc", "pop", w("Thêm ba"), 0.4, 0.12),
                      TO("#ih-ka, #ih-kb, #ih-kc", {"y": -100, "opacity": 0, "scale": 0.5}, w("Thêm ba") + 0.7, 0.4, "power2.in"),
                      OUT("#ih-n0", "up", w("Thêm ba") + 0.3, 0.2), IN("#ih-n3", "pop", w("Thêm ba") + 0.5, 0.3),
                      OUT("#ih-n3", "up", w("kết quả"), 0.2), IN("#ih-n6", "pop", w("kết quả") + 0.25, 0.35),
                      SHAKE("#ih-cnt", w("ra sáu")), IN("#ih-exp", "up", w("ra sáu"))]),
        VB("Vì addAll bên trong gọi lại add, nên mỗi phần tử bị đếm hai lần.", "Vì addAll bên trong gọi lại add(), nên mỗi phần tử bị đếm 2 lần.",
           lambda w: [OUT("#ih-hs, #ih-ins, #ih-ext, #ih-a3, #ih-a3-h, #ih-cd, #ih-cl, #ih-cnt, #ih-n6, #ih-exp", "blur", 0, 0.5),
                      IN("#ih-f1", "up", 0.6), *ARROW("ih-a4", 1.0, 0.3), IN("#ih-f2", "up", 1.2), *ARROW("ih-a5", 1.6, 0.3), IN("#ih-f3", "pop", w("gọi lại add")),
                      IN("#ih-p1", "pop", w("mỗi phần tử")), IN("#ih-p2", "pop", w("mỗi phần tử") + 0.2), IN("#ih-p3", "pop", w("mỗi phần tử") + 0.4),
                      IN("#ih-rs", "left", w("đếm hai lần"))]),
        VB("Bài học: ưu tiên composition. Chỉ kế thừa khi thật sự là quan hệ là một.", "Bài học: ưu tiên composition. Chỉ kế thừa khi thật sự là quan hệ is-a.",
           lambda w: [OUT("#ih-f1, #ih-f2, #ih-f3, #ih-a4, #ih-a4-h, #ih-a5, #ih-a5-h, #ih-rs, #ih-p1, #ih-p2, #ih-p3", "blur", 0, 0.5),
                      TYPE("#ih-t1", 0.7, 0.04), IN("#ih-t2", "blur", w("Chỉ kế thừa"))]),
    ]),
    # ------------------------------------------------------------ polymorphism basics
    dict(id="pbas", world=(1920, 1080), hud="", cam="".join([
        v_head("pa", "Phần 4 · Đa hình cơ bản", "Một lời gọi, nhiều cách chạy"),
        v_panel("pa-pn"),
        v_card("pa-k1", 130, 330, 760, 360, "Một lời gọi", "a.speak()", "amber", 60, 40),
        v_card("pa-k2", 1030, 330, 760, 360, "Nhiều cách chạy", "mỗi object tự kêu", "green", 60, 36),
        el("pa-tag1", 110, 380, 700, None, "kiểu khai báo", "lbl r", "font-size:34px"),
        v_mono("pa-var", 110, 440, 700, 240, "", "Animal a", "", "cyan", 64),
        el("pa-tag2", 1110, 380, 700, None, "object thật", "lbl r", "font-size:34px"),
        v_mono("pa-dog", 1110, 440, 700, 240, "", "new Dog()", "", "green", 64),
        v_tag("pa-call", 110, 700, 700, 170, "a.speak()", "amber", 52),
        el("pa-bub", 1110, 700, 700, 170, "Dog: Gâu gâu", "bubble r", "font-size:48px;display:flex;align-items:center;justify-content:center"),
        v_cbox("pa-loop", 110, 250, 1700, None, "for (Animal x : zoo) x.speak();", "violet", 48),
        v_tag("pa-zoo", 1310, 440, 500, 160, "List<Animal>", "violet", 44),
        v_mono("pa-t1", 110, 440, 500, 160, "", "Dog", "", "green", 52),
        v_mono("pa-t2", 710, 440, 500, 160, "", "Cat", "", "green", 52),
        v_mono("pa-t3", 1310, 440, 500, 160, "", "Bird", "", "green", 52, True),
        el("pa-b1", 110, 640, 500, 140, "Dog: Gâu gâu", "bubble r", "font-size:44px;display:flex;align-items:center;justify-content:center"),
        el("pa-b2", 710, 640, 500, 140, "Cat: Meo meo", "bubble r", "font-size:44px;display:flex;align-items:center;justify-content:center"),
        el("pa-b3", 1310, 640, 500, 140, "Bird: Chíp chíp", "bubble r", "font-size:44px;display:flex;align-items:center;justify-content:center"),
        v_tag("pa-ok", 410, 810, 1100, 110, "vòng lặp không sửa dòng nào ✓", "green", 40),
        el("pa-t4", 0, 400, 1920, None, letters("Chạy theo object thật"), "take r"),
        el("pa-t5", 0, 540, 1920, None, "không chạy theo kiểu của biến", "take-sm r"),
        wires(arrow("pa-a1", [(820, 560), (1100, 560)], "cyan")),
    ]), beats=[
        VB("Ta quay lại đa hình, nhưng lần này đi từ nền tảng.", "Ta quay lại Polymorphism (đa hình), nhưng lần này đi từ nền tảng.",
           lambda w: [IN("#pa-eye", "blur"), TYPE("#pa-q", 0.2, 0.05), *v_shrink("pa", 1.2), IN("#pa-pn", "fade", 1.6, 0.6),
                      IN("#pa-k1", "left", 1.9), IN("#pa-k2", "right", 2.8)]),
        VB("Vì Dog là một Animal, ta được phép viết Animal a bằng new Dog. Biến a có kiểu khai báo là Animal, nhưng object thật bên dưới là một Dog.",
           "Dog là một Animal nên được viết Animal a = new Dog(). Kiểu khai báo là Animal, object thật là Dog.",
           lambda w: [OUT("#pa-k1, #pa-k2", "blur", 0, 0.5), IN("#pa-var", "left", w("Animal a")), IN("#pa-tag1", "blur", w("kiểu khai báo")),
                      *ARROW("pa-a1", w("bằng new Dog"), 0.6), IN("#pa-dog", "pop", w("bằng new Dog") + 0.4), IN("#pa-tag2", "blur", w("object thật"))]),
        VB("Gọi speak trên biến a, thì Java chạy bản của object thật, tức là của Dog, chứ không phải của kiểu biến.",
           "Gọi a.speak(): Java chạy speak() của object thật (Dog), không phải của kiểu biến.",
           lambda w: [TO("#pa-var, #pa-tag1, #pa-tag2, #pa-dog, #pa-a1, #pa-a1-h", {"y": -100}, 0.0, 0.5), IN("#pa-call", "up", 0.3), PULSE("#pa-dog", w("object thật")), IN("#pa-bub", "pop", w("tức là của Dog"), 0.5)]),
        VB("Nhờ vậy ta gom nhiều con vật vào một danh sách Animal, rồi viết một vòng lặp for gọi speak. Mỗi con tự kêu theo kiểu của nó.",
           "Gom nhiều con vật vào List<Animal>, một vòng for gọi speak(): mỗi con tự kêu theo kiểu của nó.",
           lambda w: [OUT("#pa-var, #pa-tag1, #pa-tag2, #pa-dog, #pa-call, #pa-bub, #pa-a1, #pa-a1-h", "blur", 0, 0.5),
                      IN("#pa-loop", "down", 0.7), IN("#pa-zoo", "up", w("danh sách")), IN("#pa-t1", "up", w("rồi viết") - 0.4), IN("#pa-t2", "up", w("rồi viết")),
                      PULSE("#pa-loop", w("gọi speak")), IN("#pa-b1", "pop", w("Mỗi con"), 0.4), PULSE("#pa-t1", w("Mỗi con")),
                      IN("#pa-b2", "pop", w("theo kiểu"), 0.4), PULSE("#pa-t2", w("theo kiểu"))]),
        VB("Thêm một con Bird mới thì sao? Vòng lặp cũ không phải sửa dòng nào, nó vẫn chạy đúng ngay.",
           "Thêm Bird mới: vòng lặp cũ không phải sửa dòng nào.",
           lambda w: [OUT("#pa-zoo", "blur", 0, 0.3), IN("#pa-t3", "right", 0.5), PULSE("#pa-loop", w("Vòng lặp cũ")), IN("#pa-b3", "pop", w("không phải sửa"), 0.4),
                      IN("#pa-ok", "pop", w("nó vẫn chạy"))]),
        VB("Ghi nhớ: Java chạy theo object thật, không chạy theo kiểu khai báo của biến. Trong Spring, inject một interface cũng hoạt động đúng như vậy.",
           "Java chạy theo object thật, không theo kiểu khai báo. Spring inject interface cũng hoạt động như vậy.",
           lambda w: [OUT("#pa-loop, #pa-t1, #pa-t2, #pa-t3, #pa-b1, #pa-b2, #pa-b3, #pa-ok", "blur", 0, 0.5),
                      TYPE("#pa-t4", 0.7, 0.04), IN("#pa-t5", "blur", w("Trong Spring"))]),
    ]),
    # ------------------------------------------------------------ overriding vs overloading
    dict(id="ovo", world=(1920, 1080), hud="", cam="".join([
        v_head("ov", "Phần 5 · Override và Overload", "Tưởng override, thật ra overload"),
        v_panel("ov-pn"),
        v_card("ov-k1", 130, 330, 760, 360, "Overriding", "ghi đè", "cyan", 60, 40),
        v_card("ov-k2", 1030, 330, 760, 360, "Overloading", "nạp chồng", "amber", 60, 40),
        el("ov-h1", 100, 215, 800, None, "Overriding = <b>ghi đè</b>", "colhead r", "text-align:center"),
        v_cbox("ov-c1", 100, 300, 800, None, "class Dog extends Animal {\n  @Override\n  void speak() { ... }\n}", "cyan", 40),
        v_tag("ov-k1a", 100, 640, 800, 110, "cùng tên, cùng tham số", "cyan", 40),
        v_tag("ov-k1b", 100, 770, 800, 110, "cần kế thừa", "cyan", 40),
        el("ov-h2", 1020, 215, 800, None, "Overloading = <b>nạp chồng</b>", "colhead r", "text-align:center"),
        v_cbox("ov-c2", 1020, 300, 800, None, "class Printer {\n  void print(int x)\n  void print(String s)\n}", "amber", 40),
        v_tag("ov-k2a", 1020, 640, 800, 110, "cùng tên, khác tham số", "amber", 40),
        v_tag("ov-k2b", 1020, 770, 800, 110, "không cần kế thừa", "amber", 40),
        v_cbox("ov-trap", 100, 290, 1060, "Parrot.java",
               "class Animal {\n    void speak() { /* in \"Animal: ...\" */ }\n}\nclass Parrot extends Animal {\n    void speak(String word) { ... }\n}", "violet", 36),
        v_tag("ov-tag1", 1200, 320, 620, 150, "khác tham số", "red", 44),
        v_tag("ov-tag2", 1200, 520, 620, 150, "= overload, không phải override", "red", 32),
        v_cbox("ov-run", 1200, 290, 620, None, "Animal p = new Parrot();\np.speak();", "cyan", 36),
        e_con("ov-con", 1200, 510, 620, ["> Animal: ..."], 44),
        el("ov-note", 1200, 700, 620, None, "speak(String) của Parrot chưa hề được gọi", "note red r", "font-size:32px"),
        v_tag("ov-ann", 1200, 320, 620, 150, "@Override", "amber", 52),
        v_err("ov-err", 100, 770, 1720, "✕ error: method does not override or implement a method from a supertype", 30),
        el("ov-t1", 0, 400, 1920, None, letters("Luôn ghi @Override"), "take r"),
        el("ov-t2", 0, 540, 1920, None, "compiler canh giúp bạn", "take-sm r"),
        wires(arrow("ov-div", [(960, 215), (960, 900)], "muted", head=False)),
    ]), beats=[
        VB("Hai từ nghe giống nhau, nhưng là hai chuyện khác hẳn.", "Overriding và overloading nghe giống nhau, nhưng là hai chuyện khác hẳn.",
           lambda w: [IN("#ov-eye", "blur"), TYPE("#ov-q", 0.2, 0.05), *v_shrink("ov", 1.2), IN("#ov-pn", "fade", 1.6, 0.6),
                      IN("#ov-k1", "left", 1.9), IN("#ov-k2", "right", 2.8)]),
        VB("Ghi đè là lớp con viết lại method của cha, giữ nguyên tên và tham số. Nạp chồng là trong cùng một class, có nhiều method cùng tên nhưng khác tham số.",
           "Overriding: con viết lại method của cha, cùng tên cùng tham số. Overloading: cùng class, cùng tên, khác tham số.",
           lambda w: [OUT("#ov-k1, #ov-k2", "blur", 0, 0.5), *ARROW("ov-div", 0.6, 0.6), IN("#ov-h1", "blur", 0.7),
                      IN("#ov-c1", "zoomin", w("Ghi đè là"), 0.7), IN("#ov-k1a", "up", w("giữ nguyên tên")), IN("#ov-k1b", "up", w("giữ nguyên tên") + 0.7),
                      IN("#ov-h2", "blur", w("Nạp chồng là")), IN("#ov-c2", "zoomin", w("Nạp chồng là") + 0.3, 0.7),
                      IN("#ov-k2a", "up", w("nhưng khác")), IN("#ov-k2b", "up", w("nhưng khác") + 0.6)]),
        VB("Bẫy hay gặp. Lớp Animal có method speak không tham số. Lớp con Pa rợt viết speak nhận thêm một chuỗi. Tham số khác, nên đây là nạp chồng, không phải ghi đè.",
           "Animal có speak(). Parrot viết speak(String word): tham số khác, nên là overload chứ không phải override.",
           lambda w: [OUT("#ov-h1, #ov-c1, #ov-k1a, #ov-k1b, #ov-h2, #ov-c2, #ov-k2a, #ov-k2b, #ov-div, #ov-div-h", "blur", 0, 0.5),
                      IN("#ov-trap", "zoomin", 0.7, 0.8), IN("#ov-tag1", "left", w("Tham số khác")), IN("#ov-tag2", "left", w("nên đây là"))]),
        VB("Giờ tạo một con Parrot, gán vào biến kiểu Animal, rồi gọi speak. Java vẫn chạy bản của Animal, in ra Animal ba chấm. Bản của Parrot chưa hề được gọi.",
           "Animal p = new Parrot(); p.speak() vẫn in \"Animal: ...\". Bản của Parrot chưa hề được gọi.",
           lambda w: [OUT("#ov-tag1, #ov-tag2", "blur", 0, 0.4), IN("#ov-run", "right", 0.5), IN("#ov-con", "up", w("Java vẫn")),
                      IN("#ov-con-1", "type1", w("in ra Animal"), 0.3), IN("#ov-note", "up", w("Bản của Parrot")), SHAKE("#ov-note", w("Bản của Parrot") + 0.5)]),
        VB("Cách phòng: luôn ghi Override. Nếu method không thật sự ghi đè, trình biên dịch sẽ báo lỗi ngay.",
           "Cách phòng: luôn ghi @Override. Không thật sự override thì compiler báo lỗi ngay.",
           lambda w: [OUT("#ov-run, #ov-con, #ov-note", "blur", 0, 0.4), IN("#ov-ann", "pop", w("luôn ghi")), PULSE("#ov-trap", w("không thật sự")),
                      IN("#ov-err", "up", w("báo lỗi")), SHAKE("#ov-err", w("báo lỗi") + 0.4)]),
        VB("Tóm lại: ghi đè thì cùng tham số, nạp chồng thì khác tham số. Hãy luôn ghi Override để compiler canh giúp bạn.",
           "Override: cùng tham số. Overload: khác tham số. Luôn ghi @Override để compiler canh giúp bạn.",
           lambda w: [OUT("#ov-trap, #ov-ann, #ov-err", "blur", 0, 0.5), TYPE("#ov-t1", 0.7, 0.04), IN("#ov-t2", "blur", w("compiler"))]),
    ]),
    # ------------------------------------------------------------ polymorphism (wide world: camera pans right)
    dict(id="poly", world=(1920, 1080), hud="", cam="".join([
        v_head("po", "Phần 6 · Polymorphism", "Cùng lời gọi, khác hành vi"),
        v_panel("po-pn"),
        v_card("po-k1", 130, 330, 760, 360, "Cùng một lời gọi", "a.speak()", "cyan", 56, 40),
        v_card("po-k2", 1030, 330, 760, 360, "Hành vi khác nhau", "tùy object thực tế", "green", 56, 38),
        v_mono("po-var", 130, 330, 560, 170, "kiểu khai báo", "Animal a", "", "cyan", 52),
        v_mono("po-dog", 1230, 330, 560, 170, "object thật", "new Dog()", "", "green", 52),
        v_tag("po-call", 130, 580, 760, 120, "a.speak()", "amber", 52),
        v_tag("po-bub", 1030, 580, 760, 120, "Gâu gâu!", "green", 52),
        v_tag("po-rt", 360, 770, 1200, 120, "RUNTIME · theo object thật", "cyan", 44),
        v_tag("po-mo", 130, 330, 760, 140, "print(Object o)", "cyan", 48),
        v_tag("po-ms", 1030, 330, 760, 140, "print(String s)", "cyan", 48),
        v_tag("po-ct", 360, 770, 1200, 120, "COMPILE TIME · theo kiểu khai báo", "amber", 44),
        v_tag("po-ov", 560, 600, 800, 120, 'Object o = "hello"', "violet", 48),
        v_tag("po-x", 1030, 490, 760, 90, "✕ không chọn bản này", "red", 36),
        v_tag("po-out", 560, 780, 800, 110, "→ print(Object)", "green", 48),
        wires(arrow("po-a1", [(700, 415), (1220, 415)], "cyan"),
              arrow("po-a2", [(760, 595), (760, 475)], "green")),
    ]), beats=[
        VB("Thứ ba: đa hình. Cùng một lời gọi, hành vi khác nhau tùy đối tượng thực tế.",
           "Thứ ba: Polymorphism (đa hình). Cùng một lời gọi, hành vi khác nhau tuỳ object thực tế.",
           lambda w: [IN("#po-eye", "blur"), TYPE("#po-q", 0.2, 0.05), *v_shrink("po", 1.2), IN("#po-pn", "fade", 1.6, 0.6),
                      IN("#po-k1", "left", max(1.9, w("Cùng một"))), IN("#po-k2", "right", max(2.6, w("hành vi")))]),
        VB("Biến kiểu Animal, nhưng đối tượng thật là Dog. Gọi speak, ta nhận được gâu gâu.",
           "Biến kiểu Animal, nhưng object thật là Dog. Gọi speak(), ta nhận được \"Gâu gâu\".",
           lambda w: [OUT("#po-k1, #po-k2", "blur", 0, 0.5), IN("#po-var", "left", 0.6), *ARROW("po-a1", w("nhưng đối tượng"), 0.6),
                      IN("#po-dog", "pop", w("đối tượng thật")), IN("#po-call", "up", w("Gọi speak")),
                      IN("#po-bub", "pop", w("gâu gâu"), 0.5), PULSE("#po-dog", w("gâu gâu"))]),
        VB("Đây là ghi đè. JVM chọn phương thức lúc chạy, dựa trên đối tượng thật.",
           "Đây là overriding (ghi đè): JVM chọn method lúc runtime, dựa trên object thật.",
           lambda w: [PULSE("#po-dog", w("dựa trên")), IN("#po-rt", "pop", w("JVM chọn"), 0.45)]),
        VB("Còn nạp chồng thì được chọn ngay lúc biên dịch, dựa trên kiểu khai báo của biến.",
           "Còn overloading (nạp chồng) được chọn lúc compile, dựa trên kiểu khai báo của biến.",
           lambda w: [OUT(vS("po-var", "po-dog", "po-call", "po-bub", "po-rt") + ", " + vAR("po-a1"), "blur", 0, 0.5),
                      IN("#po-mo", "up", 0.7), IN("#po-ms", "up", w("lúc biên dịch")), IN("#po-ct", "pop", w("kiểu khai báo"), 0.45)]),
        VB("Bẫy hay gặp: biến kiểu Object đang chứa chuỗi hello. Gọi print, kết quả là bản nhận Object, không phải String.",
           "Bẫy hay gặp: biến kiểu Object chứa \"hello\". Gọi print(o) → chạy bản nhận Object, không phải String.",
           lambda w: [OUT("#po-ct", "blur", 0, 0.4), IN("#po-ov", "up", 0.6), *ARROW("po-a2", w("Gọi print"), 0.6), PULSE("#po-mo", w("bản nhận Object")),
                      DIM("#po-ms", w("không phải"), 0.35, 0.3), IN("#po-x", "pop", w("không phải")), IN("#po-out", "pop", w("bản nhận Object"))]),
    ]),
    # ------------------------------------------------------------ abstraction
    dict(id="abs", world=(1920, 1080), hud="", cam="".join([
        v_head("ab", "Phần 7 · Abstraction", "Cắm gì cũng được, miễn đúng chuẩn"),
        v_panel("ab-pn"),
        v_card("ab-sk", 160, 400, 520, 300, "Ổ cắm", "chỉ cần đúng chuẩn chân cắm", "violet", 56, 30, "plug"),
        v_tag("ab-d1", 1080, 270, 640, 130, "Quạt", "cyan", 44),
        v_tag("ab-d2", 1080, 450, 640, 130, "Tivi", "cyan", 44),
        v_tag("ab-d3", 1080, 630, 640, 130, "Sạc điện thoại", "cyan", 44),
        v_card("ab-s1", 160, 360, 720, 340, "Cho thấy", "làm được gì", "green", 60, 36),
        v_card("ab-s2", 1040, 360, 720, 340, "Giấu đi", "làm thế nào", "muted", 60, 36),
        v_cbox("ab-if", 120, 380, 960, "PaymentGateway.java",
               "interface PaymentGateway {\n    boolean charge(long amount);\n}", "violet", 44),
        v_card("ab-ct", 1200, 400, 600, 260, "Hợp đồng", "phải có hàm charge()", "violet", 52, 32),
        v_mono("ab-ib", 610, 250, 700, 130, "«interface»", "PaymentGateway", "", "violet", 44),
        v_cbox("ab-mo", 100, 470, 850, None,
               "class MomoGateway\n    implements PaymentGateway {\n  public boolean charge(long a) {\n"
               "    System.out.println(\"MoMo charge \" + a);\n    return true;\n  }\n}", "cyan", 28),
        v_cbox("ab-zp", 970, 470, 850, None,
               "class ZaloPayGateway\n    implements PaymentGateway {\n  public boolean charge(long a) {\n"
               "    System.out.println(\"ZaloPay charge \" + a);\n    return true;\n  }\n}", "green", 28),
        chip("ab-imp", 850, 405, "implements", "violet"),
        v_cbox("ab-os", 100, 300, 800, "OrderService.java",
               "class OrderService {\n  private final PaymentGateway gateway;\n\n  void checkout(long total) {\n"
               "    gateway.charge(total);\n  }\n}", "amber", 30),
        v_mono("ab-ib2", 1020, 300, 800, 130, "«interface»", "PaymentGateway", "", "violet", 44),
        v_mono("ab-im", 1020, 600, 380, 120, "", "MomoGateway", "", "cyan", 36),
        v_mono("ab-iz", 1440, 600, 380, 120, "", "ZaloPayGateway", "", "green", 36),
        chip("ab-know", 100, 810, "chỉ biết gọi charge()", "amber"),
        v_con("ab-con", 100, 300, 800, ["> MoMo charge 250000", "> ZaloPay charge 250000"], 44),
        chip("ab-c1", 100, 640, "OrderService: không đổi một dòng", "green"),
        chip("ab-c2", 100, 730, "Thêm cổng mới = thêm một class", "green"),
        el("ab-t1", 0, 400, 1920, None, letters("Dựa vào chuẩn, đừng dựa vào chi tiết"), "take r"),
        el("ab-t2", 0, 540, 1920, None, "Spring inject interface, Spring chọn cổng cụ thể", "take-sm r"),
        wires(arrow("ab-a1", [(1070, 335), (690, 500)], "cyan"), arrow("ab-a2", [(1070, 515), (690, 550)], "cyan"),
              arrow("ab-a3", [(1070, 695), (690, 600)], "cyan"),
              arrow("ab-b1", [(525, 470), (790, 383)], "violet", True), arrow("ab-b2", [(1395, 470), (1130, 383)], "violet", True),
              arrow("ab-c1w", [(905, 420), (1010, 380)], "amber"),
              arrow("ab-e1", [(1210, 600), (1210, 436)], "violet", True), arrow("ab-e2", [(1630, 600), (1630, 436)], "violet", True)),
    ]), beats=[
        VB("Hãy nghĩ tới ổ cắm điện trong nhà. Quạt, tivi, sạc điện thoại đều cắm được vào cùng một ổ. Ổ cắm không cần biết bên trong thiết bị chạy thế nào, chỉ cần đúng chuẩn chân cắm.",
           "Ổ cắm điện: quạt, tivi, sạc điện thoại cắm chung một ổ. Ổ cắm chỉ cần đúng chuẩn chân cắm.",
           lambda w: [IN("#ab-eye", "blur"), TYPE("#ab-q", 0.2, 0.05), *v_shrink("ab", 1.2), IN("#ab-pn", "fade", 1.6, 0.6), IN("#ab-sk", "zoomin", 1.9, 0.6),
                      IN("#ab-d1", "right", w("Quạt")), *ARROW("ab-a1", w("Quạt") + 0.3, 0.5),
                      IN("#ab-d2", "right", w("tivi")), *ARROW("ab-a2", w("tivi") + 0.3, 0.5),
                      IN("#ab-d3", "right", w("sạc")), *ARROW("ab-a3", w("sạc") + 0.3, 0.5),
                      PULSE("#ab-sk", w("chỉ cần đúng chuẩn"))]),
        VB("Trừu tượng cũng vậy. Chỉ cho thấy một thứ làm được gì, và giấu đi làm thế nào.",
           "Abstraction cũng vậy: chỉ cho thấy làm được gì, giấu đi làm thế nào.",
           lambda w: [OUT(vS("ab-sk", "ab-d1", "ab-d2", "ab-d3") + ", " + vAR("ab-a1", "ab-a2", "ab-a3"), "blur", 0, 0.5),
                      IN("#ab-s1", "left", w("Chỉ cho thấy")), IN("#ab-s2", "right", w("giấu đi")), PULSE("#ab-s1", w("làm được gì"))]),
        VB("Trong Java, chuẩn đó viết bằng interface. Interface PaymentGateway nói: ai muốn làm cổng thanh toán thì phải có hàm charge.",
           "Trong Java, chuẩn viết bằng interface: ai làm cổng thanh toán thì phải có hàm charge().",
           lambda w: [OUT("#ab-s1, #ab-s2", "blur", 0, 0.5), IN("#ab-if", "zoomin", 0.6, 0.7), IN("#ab-ct", "right", w("ai muốn")),
                      PULSE("#ab-if", w("phải có hàm"))]),
        VB("Class nào theo chuẩn thì ghi implement. Hai class Mô Mô và Da lô Pây, mỗi cái tự viết hàm thanh toán theo cách riêng.",
           "Theo chuẩn thì ghi implements, mỗi cổng tự viết charge() theo cách riêng.",
           lambda w: [OUT("#ab-if, #ab-ct", "blur", 0, 0.5), IN("#ab-ib", "down", 0.6), IN("#ab-imp", "pop", w("ghi implement")),
                      IN("#ab-mo", "up", w("Mô Mô")), *ARROW("ab-b1", w("Mô Mô") + 0.3, 0.5),
                      IN("#ab-zp", "up", w("Da lô Pây")), *ARROW("ab-b2", w("Da lô Pây") + 0.3, 0.5)]),
        VB("Bên dưới, Order Service chỉ giữ một biến kiểu PaymentGateway, rồi gọi gateway charge. Nó không biết, cũng không cần biết đang dùng cổng nào.",
           "OrderService chỉ giữ biến kiểu PaymentGateway và gọi gateway.charge().",
           lambda w: [OUT(vS("ab-ib", "ab-imp", "ab-mo", "ab-zp") + ", " + vAR("ab-b1", "ab-b2"), "blur", 0, 0.5),
                      IN("#ab-os", "left", 0.7), IN("#ab-ib2", "right", w("PaymentGateway") + 0.2), *ARROW("ab-c1w", w("rồi gọi"), 0.5),
                      IN("#ab-im", "up", w("rồi gọi") + 0.8), IN("#ab-iz", "up", w("rồi gọi") + 1.3),
                      *ARROW("ab-e1", w("rồi gọi") + 1.6, 0.4), *ARROW("ab-e2", w("rồi gọi") + 2.0, 0.4), IN("#ab-know", "up", w("Nó không biết"))]),
        VB("Chạy thật: chọn cổng Mô Mô thì in ra hai trăm năm mươi nghìn qua Mô Mô. Chọn Da lô Pây thì in qua Da lô Pây, số tiền vẫn thế. Code của service không đổi một dòng. Thêm cổng mới chỉ là thêm một class.",
           "Chạy thật: MoMo charge 250000, ZaloPay charge 250000. Service không đổi.",
           lambda w: [OUT("#ab-os, #ab-know", "blur", 0, 0.5), IN("#ab-con", "up", 0.6), IN("#ab-con-1", "type1", w("chọn cổng Mô Mô"), 0.3),
                      PULSE("#ab-im", w("chọn cổng Mô Mô")), IN("#ab-con-2", "type1", w("Chọn Da lô Pây"), 0.3), PULSE("#ab-iz", w("Chọn Da lô Pây")),
                      IN("#ab-c1", "up", w("Code của service")), IN("#ab-c2", "up", w("Thêm cổng mới"))]),
        VB("Trong Spring cũng vậy: service inject một interface, còn Spring đưa vào cổng cụ thể. Ghi nhớ: dựa vào chuẩn, đừng dựa vào chi tiết.",
           "Spring inject interface, Spring chọn cổng. Dựa vào chuẩn, đừng dựa vào chi tiết.",
           lambda w: [OUT(vS("ab-con", "ab-c1", "ab-c2", "ab-ib2", "ab-im", "ab-iz") + ", " + vAR("ab-c1w", "ab-e1", "ab-e2"), "blur", 0, 0.5),
                      TYPE("#ab-t1", w("Ghi nhớ"), 0.04), IN("#ab-t2", "blur", w("Ghi nhớ") + 1.8)]),
    ]),
    # ------------------------------------------------------------ interface vs abstract class
    dict(id="ivsa", world=(1920, 1080), hud="", cam="".join([
        v_head("iv", "Phần 8 · Câu hỏi xoáy", "Interface hay abstract class?"),
        v_panel("iv-pn"),
        v_card("iv-k1", 130, 330, 760, 360, "Abstract class", "class dở dang", "amber", 56, 34),
        v_card("iv-k2", 1030, 330, 760, 360, "Interface", "hợp đồng thuần", "cyan", 56, 34),
        chip("iv-q1", 690, 780, "khác nhau: được phép chứa gì", "violet"),
        v_cbox("iv-an", 100, 260, 900, "Animal.java",
               "abstract class Animal {\n    protected final String name;\n    Animal(String name) { this.name = name; }\n"
               "    abstract String sound();\n    String describe() {\n        return name + \" says \" + sound();\n    }\n}", "amber", 30),
        v_cbox("iv-nw", 1040, 280, 790, None, "Animal a = new Animal();", "red", 36),
        v_err("iv-err", 1040, 430, 790, "✕ Animal is abstract; cannot be instantiated"),
        chip("iv-f1", 1040, 290, "field: name", "amber"),
        chip("iv-f2", 1040, 390, "constructor: Animal(String name)", "amber"),
        chip("iv-f3", 1040, 490, "code dùng chung: describe()", "amber"),
        chip("iv-f4", 1040, 590, "method abstract: sound()", "amber"),
        chip("iv-f5", 1040, 740, "chỉ extends được 1 class", "violet"),
        v_cbox("iv-if", 100, 270, 900, "Flyable và Swimmable",
               "interface Flyable {\n    void fly();\n    default String mode() { return \"flying\"; }\n}\n\n"
               "interface Swimmable {\n    void swim();\n}", "cyan", 28),
        chip("iv-g1", 1060, 330, "không field instance", "cyan"),
        chip("iv-g2", 1060, 430, "không constructor", "cyan"),
        chip("iv-g3", 1060, 530, "implements được nhiều", "green"),
        v_mono("iv-pa", 100, 340, 270, 130, "", "Animal", "abstract class", "amber", 36),
        v_mono("iv-pf", 395, 340, 270, 130, "", "Flyable", "interface", "cyan", 36),
        v_mono("iv-ps", 690, 340, 270, 130, "", "Swimmable", "interface", "cyan", 36),
        v_mono("iv-pd", 395, 660, 270, 140, "", "Duck", "", "green", 44),
        v_cbox("iv-dk", 1010, 330, 820, None, "class Duck extends Animal\n    implements Flyable, Swimmable {", "green", 34),
        v_con("iv-con", 1010, 560, 820, ["> Duck says quack / flying", "> Duck flies", "> Duck swims"], 36),
        chip("iv-st", 640, 270, "Mặc định: chọn interface", "green"),
        v_mono("iv-l", 120, 430, 480, 170, "interface", "List", "", "cyan", 48),
        v_mono("iv-al", 730, 430, 480, 170, "khung chung", "AbstractList", "", "amber", 44),
        v_mono("iv-ar", 1340, 430, 480, 170, "class cụ thể", "ArrayList", "", "green", 44),
        chip("iv-n1", 520, 740, "Nhiều class trùng code: thêm abstract class ở giữa", "violet"),
        wires(arrow("iv-a1", [(425, 660), (250, 475)], "amber"), arrow("iv-a2", [(530, 660), (530, 475)], "cyan", True),
              arrow("iv-a3", [(620, 660), (790, 475)], "cyan", True),
              arrow("iv-a4", [(730, 515), (606, 515)], "cyan", True), arrow("iv-a5", [(1340, 515), (1216, 515)], "amber")),
    ]), beats=[
        VB("Cả hai đều là cách nói: class con phải có những method này. Khác nhau ở chỗ chúng được phép chứa gì.",
           "Cả hai đều nói \"class con phải có những method này\". Khác nhau ở chỗ được phép chứa gì.",
           lambda w: [IN("#iv-eye", "blur"), TYPE("#iv-q", 0.2, 0.05), *v_shrink("iv", 1.3), IN("#iv-pn", "fade", 1.6, 0.6),
                      IN("#iv-k1", "left", 2.0), IN("#iv-k2", "right", 3.0), IN("#iv-q1", "up", w("Khác nhau"))]),
        VB("Abstract class là class dở dang. Muốn new trực tiếp thì compiler báo lỗi, vì Animal là abstract, không thể tạo object.",
           "Abstract class là class dở dang: new trực tiếp thì compiler báo lỗi.",
           lambda w: [OUT("#iv-k1, #iv-k2, #iv-q1", "blur", 0, 0.5), IN("#iv-an", "left", 0.6, 0.7), IN("#iv-nw", "right", w("Muốn new")),
                      IN("#iv-err", "up", w("compiler")), SHAKE("#iv-err", w("compiler") + 0.5)]),
        VB("Bù lại, nó giữ được field, constructor và code dùng chung cho class con, cộng thêm method abstract chưa có thân. Mỗi class chỉ extends được một abstract class.",
           "Bù lại: có field, constructor, code dùng chung, method abstract. Chỉ extends được 1.",
           lambda w: [OUT("#iv-nw, #iv-err", "blur", 0, 0.5), IN("#iv-f1", "right", w("field")), PULSE("#iv-an", w("field") + 0.2),
                      IN("#iv-f2", "right", w("constructor")), IN("#iv-f3", "right", w("code dùng chung")), IN("#iv-f4", "right", w("method abstract")),
                      IN("#iv-f5", "pop", w("Mỗi class"))]),
        VB("Interface là hợp đồng thuần. Không có field instance, không có constructor. Nhưng một class implement được nhiều interface.",
           "Interface là hợp đồng: không field instance, không constructor, nhưng implements được nhiều interface.",
           lambda w: [OUT("#iv-an, #iv-f1, #iv-f2, #iv-f3, #iv-f4, #iv-f5", "blur", 0, 0.5), IN("#iv-if", "left", 0.6, 0.7),
                      IN("#iv-g1", "right", w("Không có field")), IN("#iv-g2", "right", w("không có constructor")), IN("#iv-g3", "pop", w("Nhưng một class"))]),
        VB("Ví dụ con vịt. Duck extends Animal, rồi implement thêm hai interface, một cái bay, một cái bơi.",
           "Ví dụ: Duck extends Animal implements Flyable, Swimmable.",
           lambda w: [OUT("#iv-if, #iv-g1, #iv-g2, #iv-g3", "blur", 0, 0.5), IN("#iv-pd", "up", 0.6), IN("#iv-dk", "right", w("Duck extends")),
                      IN("#iv-pa", "down", w("Animal,")), *ARROW("iv-a1", w("Animal,") + 0.3, 0.5),
                      IN("#iv-pf", "down", w("một cái bay")), *ARROW("iv-a2", w("một cái bay") + 0.3, 0.5),
                      IN("#iv-ps", "down", w("một cái bơi")), *ARROW("iv-a3", w("một cái bơi") + 0.3, 0.5)]),
        VB("Chạy thật, ra ba dòng. Dòng đầu gồm mô tả dùng chung từ Animal, và chế độ flying từ Flyable. Hai dòng sau là con vịt bay và con vịt bơi.",
           "Chạy thật: Duck says quack / flying, rồi Duck flies, Duck swims.",
           lambda w: [IN("#iv-con", "up", 0.4), IN("#iv-con-1", "type1", w("Dòng đầu"), 0.3), PULSE("#iv-pa", w("Animal,")), PULSE("#iv-pf", w("Flyable")),
                      IN("#iv-con-2", "type1", w("Hai dòng sau"), 0.3), PULSE("#iv-pd", w("con vịt bay")),
                      IN("#iv-con-3", "type1", w("con vịt bơi"), 0.3), PULSE("#iv-ps", w("con vịt bơi"))]),
        VB("Quy tắc thực tế: mặc định chọn interface. Khi nhiều class trùng code và state, thêm một abstract class implement interface đó. JDK làm đúng như vậy: List, AbstractList, rồi ArrayList.",
           "Mặc định chọn interface. JDK: List → AbstractList → ArrayList.",
           lambda w: [OUT(vS("iv-pa", "iv-pf", "iv-ps", "iv-pd", "iv-dk", "iv-con") + ", " + vAR("iv-a1", "iv-a2", "iv-a3"), "blur", 0, 0.5),
                      IN("#iv-st", "pop", 0.6), IN("#iv-l", "pop", w("List,")), IN("#iv-al", "pop", w("AbstractList")), *ARROW("iv-a4", w("AbstractList") + 0.3, 0.4),
                      IN("#iv-ar", "pop", w("rồi ArrayList")), *ARROW("iv-a5", w("rồi ArrayList") + 0.3, 0.4), IN("#iv-n1", "up", w("Khi nhiều"))]),
    ]),
    # ------------------------------------------------------------ pass-by-value
    dict(id="pbv", world=(1920, 1080), hud="", cam="".join([
        v_head("pb", "Phần 9 · Câu bẫy cuối", "Bản gốc hay bản sao?"),
        v_panel("pb-pn"),
        v_card("pb-g", 130, 330, 760, 380, "Bản gốc", "✕ không bao giờ", "red", 60, 36),
        v_card("pb-s", 1030, 330, 760, 380, "Bản sao", "✓ luôn luôn: pass-by-value", "green", 60, 34),
        v_cbox("pb-c0", 100, 300, 800, "Số nguyên", "static void inc(int x) { x++; }\n\nint n = 5;\ninc(n);", "violet", 36),
        v_tag("pb-n", 1040, 300, 340, 120, "n = 5", "cyan", 44),
        v_tag("pb-x5", 1480, 300, 340, 120, "x = 5", "amber", 44),
        v_tag("pb-x6", 1480, 300, 340, 120, "x = 6", "amber", 44),
        el("pb-cp", 1040, 460, 790, None, "x là bản sao của n", "note", "font-size:34px"),
        v_con("pb-con1", 1040, 580, 790, ["> n after inc = 5"], 44),
        v_cbox("pb-s1", 460, 200, 1000, None, "Dog d = new Dog(\"Milu\");", "violet", 38),
        v_cbox("pb-s2", 460, 200, 1000, None, "reassign(d);", "violet", 38),
        v_cbox("pb-s3", 460, 200, 1000, None, "static void reassign(Dog d) { d = new Dog(\"Lu\"); }", "violet", 38),
        v_cbox("pb-s4", 460, 200, 1000, None, "static void rename(Dog d) { d.name = \"Lu\"; }", "violet", 38),
        el("pb-st", 90, 340, 700, 590, "", "gbox muted panel r"),
        el("pb-hp", 1130, 340, 700, 590, "", "gbox muted panel r"),
        el("pb-lst", 130, 360, 620, None, "Stack: các biến", "lbl r", "font-size:32px"),
        el("pb-lhp", 1170, 360, 620, None, "Heap: các object", "lbl r", "font-size:32px"),
        v_var("pb-m", 130, 430, 620, 110, "main: d", 1, "cyan", "cyan"),
        v_var("pb-p1", 130, 590, 620, 110, "reassign: d", 1, "amber", "amber"),
        v_var("pb-p1b", 130, 590, 620, 110, "reassign: d", 2, "amber", "red"),
        v_var("pb-p2", 130, 590, 620, 110, "rename: d", 1, "amber", "amber"),
        v_obj("pb-o1", 1170, 430, 620, 110, 1,
              'Dog · name = <span class="swap" style="width:150px;height:50px;font-size:36px;line-height:50px"><i id="pb-n1">"Milu"</i><i id="pb-n2">"Lu"</i></span>', "green", "cyan"),
        v_obj("pb-o2", 1170, 590, 620, 110, 2, 'Dog · name = "Lu"', "red", "red", True),
        chip("pb-t1", 130, 760, "d = tờ giấy ghi địa chỉ nhà", "amber"),
        chip("pb-t2", 130, 760, "gọi method = phô tô tờ giấy", "amber"),
        v_con("pb-con", 130, 740, 620, ["> after reassign: Milu", "> after rename: Lu"], 32),
        el("pb-t3", 0, 400, 1920, None, letters("Copy địa chỉ, không copy object"), "take r"),
        el("pb-t4", 0, 540, 1920, None, "Java luôn luôn pass-by-value", "take-sm r"),
        wires(arrow("pb-a1", [(750, 465), (1160, 465)], "cyan"),
              arrow("pb-a2", [(750, 645), (950, 645), (950, 510), (1160, 510)], "amber"),
              arrow("pb-a3", [(750, 645), (1160, 645)], "red", True),
              arrow("pb-a4", [(750, 645), (950, 645), (950, 510), (1160, 510)], "amber"),
              arrow("pb-a5", [(1385, 360), (1475, 360)], "amber")),
    ]), beats=[
        VB("Khi gọi một method, Java đưa cho method cái gì? Bản gốc, hay bản sao? Câu trả lời: luôn luôn là bản sao. Gọi là pass by value, truyền tham trị.",
           "Gọi method, Java đưa bản gốc hay bản sao? Luôn luôn là bản sao: pass-by-value (truyền tham trị).",
           lambda w: [IN("#pb-eye", "blur"), TYPE("#pb-q", 0.2, 0.05), *v_shrink("pb", 1.3), IN("#pb-pn", "fade", 1.6, 0.6),
                      IN("#pb-g", "left", w("Bản gốc,")), IN("#pb-s", "right", w("hay bản sao")), SHAKE("#pb-g", w("Câu trả lời")),
                      PULSE("#pb-s", w("luôn luôn"))]),
        VB("Với số thì dễ. Biến n bằng năm, gọi inc của n, trong đó inc tăng x lên một. Chạy thật, n vẫn là năm, vì inc chỉ tăng bản sao.",
           "Với số: n = 5, inc(n) làm x++. Chạy thật n vẫn là 5, vì inc chỉ tăng bản sao.",
           lambda w: [OUT("#pb-g, #pb-s", "blur", 0, 0.5), IN("#pb-c0", "left", 0.6, 0.7), IN("#pb-n", "right", w("Biến n")),
                      IN("#pb-x5", "right", w("gọi inc")), *ARROW("pb-a5", w("gọi inc") + 0.3, 0.4), IN("#pb-cp", "up", w("trong đó")),
                      OUT("#pb-x5", "up", w("tăng x"), 0.2), IN("#pb-x6", "pop", w("tăng x") + 0.1, 0.35),
                      IN("#pb-con1", "up", w("Chạy thật")), IN("#pb-con1-1", "type1", w("Chạy thật") + 0.4, 0.3)]),
        VB("Với object thì khó hơn. Biến d không chứa con chó. Nó chứa địa chỉ của con chó, như tờ giấy ghi địa chỉ nhà.",
           "Với object: biến d không chứa con chó, nó chứa địa chỉ, như tờ giấy ghi địa chỉ nhà.",
           lambda w: [OUT(vS("pb-c0", "pb-n", "pb-x6", "pb-cp", "pb-con1") + ", " + vAR("pb-a5"), "blur", 0, 0.5),
                      IN("#pb-s1", "down", 0.6), IN("#pb-st, #pb-hp", "blur", 0.8, 0.6, 0.12), IN("#pb-lst, #pb-lhp", "fade", 1.2),
                      IN("#pb-m", "left", w("Biến d")), IN("#pb-o1", "right", w("Biến d") + 0.5), *ARROW("pb-a1", w("Nó chứa") , 0.5),
                      IN("#pb-t1", "up", w("như tờ giấy"))]),
        VB("Gọi method là phô tô tờ giấy đó. Tham số d là tờ giấy thứ hai, cùng ghi địa chỉ số một, nên cùng chỉ một ngôi nhà.",
           "Gọi method = photocopy tờ giấy. Tham số d là tờ thứ hai, cùng địa chỉ @1, cùng chỉ một ngôi nhà.",
           lambda w: [OUT("#pb-s1, #pb-t1", "blur", 0, 0.4), IN("#pb-s2", "down", 0.3), IN("#pb-t2", "up", 0.6),
                      IN("#pb-p1", "up", w("Tham số d")), *ARROW("pb-a2", w("cùng ghi") , 0.6), PULSE("#pb-o1", w("cùng chỉ"))]),
        VB("Nếu method xé tờ copy rồi viết địa chỉ mới, d bằng new Dog Lu, thì chỉ tờ copy đổi sang địa chỉ số hai. Tờ gốc vẫn chỉ nhà cũ. Chạy thật: sau reassign, d chấm name vẫn là Milu.",
           "Gán lại tham số: chỉ bản copy đổi sang @2, biến ở main vẫn @1. Chạy thật: sau reassign vẫn là Milu.",
           lambda w: [OUT("#pb-s2, #pb-t2, #pb-p1", "blur", 0, 0.4), IN("#pb-s3", "down", 0.3), IN("#pb-p1b", "pop", w("viết địa chỉ mới")),
                      OUT("#pb-a2, #pb-a2-h", "fade", w("viết địa chỉ mới"), 0.25), IN("#pb-o2", "pop", w("thì chỉ tờ copy")), *ARROW("pb-a3", w("thì chỉ tờ copy") + 0.3, 0.5),
                      PULSE("#pb-m", w("Tờ gốc")), IN("#pb-con", "up", w("Chạy thật")), IN("#pb-con-1", "type1", w("Chạy thật") + 0.5, 0.3)]),
        VB("Còn nếu method sửa đồ trong nhà, d chấm name bằng Lu, thì hai tờ giấy cùng chỉ một ngôi nhà. Nên object thật đổi tên. Chạy thật: sau rename, tên là Lu.",
           "Sửa field qua tham số: hai biến cùng trỏ @1, nên object thật đổi tên. Chạy thật: sau rename là Lu.",
           lambda w: [OUT("#pb-s3, #pb-p1b, #pb-a3, #pb-a3-h", "blur", 0, 0.4), DIM("#pb-o2", 0, 0.25), IN("#pb-s4", "down", 0.3),
                      IN("#pb-p2", "up", w("sửa đồ")), *ARROW("pb-a4", w("hai tờ giấy"), 0.5),
                      OUT("#pb-n1", "up", w("object thật"), 0.25), IN("#pb-n2", "pop", w("object thật") + 0.1, 0.35), PULSE("#pb-o1", w("object thật") + 0.3),
                      IN("#pb-con-2", "type1", w("Chạy thật"), 0.3)]),
        VB("Tóm lại: hai biến, một object. Thứ được copy là địa chỉ, không phải object. Sửa field qua tham số thì object thật đổi, còn gán lại tham số thì bên ngoài không đổi.",
           "Hai biến, một object. Thứ được copy là địa chỉ, không phải object.",
           lambda w: [OUT(vS("pb-s4", "pb-st", "pb-hp", "pb-lst", "pb-lhp", "pb-m", "pb-p2", "pb-o1", "pb-o2", "pb-con") + ", " + vAR("pb-a1", "pb-a4"), "blur", 0, 0.5),
                      TYPE("#pb-t3", w("Thứ được copy"), 0.04), IN("#pb-t4", "blur", w("Thứ được copy") + 1.8)]),
    ]),
    # ------------------------------------------------------------ tell, don't ask
    dict(id="tda", world=(1920, 1080), hud="", cam="".join([
        v_head("td", "Phần 10 · Tell, Don't Ask", "Quy tắc nằm ở đâu?"),
        v_panel("td-pn"),
        v_card("td-k1", 430, 360, 1060, 340, "Số dư không được âm", "quy tắc này nên nằm ở đâu?", "amber", 64, 40),
        v_cbox("td-svc", 100, 290, 900, "PaymentService",
               "if (a.getBalance() >= amount)\n    a.setBalance(\n        a.getBalance() - amount);", "amber", 36),
        v_card("td-acc", 1100, 290, 720, 200, "Account", "getBalance() · setBalance()", "cyan", 56, 34),
        box("td-bal", 1100, 540, 720, 110,
            '<span class="mono" style="font-size:44px">balance = </span><span class="swap" style="width:130px;height:60px;font-size:44px;line-height:60px"><i id="td-n100">100</i><i id="td-nm50">-50</i></span>',
            "cyan", "row"),
        v_tag("td-lbl", 100, 620, 900, 110, "hỏi dữ liệu ra, rồi tự quyết", "amber", 38),
        v_cbox("td-job", 100, 600, 900, "RefundJob", "a.setBalance(\n    a.getBalance() - fee);", "red", 36),
        v_err("td-neg", 1100, 720, 720, "✕ số dư âm, không ai chặn", 36),
        v_card("td-rich", 1100, 330, 700, 300, "Account", "withdraw(amount)", "green", 64, 44),
        v_tag("td-w1", 130, 340, 600, 130, "PaymentService", "amber", 40),
        v_tag("td-w2", 130, 540, 600, 130, "RefundJob", "amber", 40),
        v_err("td-err", 100, 720, 1720, "✕ IllegalStateException: insufficient balance", 38),
        v_tag("td-keep", 100, 810, 760, 100, "số dư vẫn = 100 ✓", "green", 40),
        el("td-t1", 0, 400, 1920, None, letters("Bảo object làm việc"), "take r"),
        el("td-t2", 0, 540, 1920, None, "Setter = cửa không có người gác", "take-sm r"),
        wires(arrow("td-a1", [(1005, 390), (1095, 390)], "amber"),
              arrow("td-a2", [(1005, 690), (1095, 620)], "red", True),
              arrow("td-a3", [(735, 405), (1095, 450)], "amber"),
              arrow("td-a4", [(735, 605), (1095, 520)], "amber")),
    ]), beats=[
        VB("Quay lại tài khoản ngân hàng ở phần một. Quy tắc số dư không âm giờ nên nằm ở đâu?",
           "Quay lại BankAccount ở phần 1: quy tắc \"số dư không âm\" nên nằm ở đâu?",
           lambda w: [IN("#td-eye", "blur"), TYPE("#td-q", 0.2, 0.05), *v_shrink("td", 1.2), IN("#td-pn", "fade", 1.6, 0.6),
                      IN("#td-k1", "zoomin", max(1.9, w("Quy tắc")), 0.7)]),
        VB("Có một cách viết trông rất chuẩn. Account chỉ có getter và setter. Còn PaymentService tự hỏi số dư, rồi tự quyết định có trừ tiền hay không. Kiểu này gọi là object thiếu máu.",
           "Kiểu anemic: Account chỉ có getter/setter, PaymentService tự hỏi số dư rồi tự quyết định.",
           lambda w: [OUT("#td-k1", "blur", 0, 0.5), IN("#td-acc", "left", w("Account chỉ có")), IN("#td-bal", "up", w("Account chỉ có") + 0.6),
                      IN("#td-svc", "zoomin", w("Còn PaymentService"), 0.8), *ARROW("td-a1", w("Còn PaymentService") + 1.0, 0.5),
                      IN("#td-lbl", "up", w("rồi tự quyết định"))]),
        VB("Vài tháng sau, có người viết thêm RefundJob. Họ gọi thẳng set balance mà không biết phải kiểm tra. Số dư một trăm bị trừ phí một trăm năm mươi, và thành âm năm mươi.",
           "RefundJob gọi thẳng setBalance mà quên kiểm tra: số dư 100 trừ phí 150 thành -50.",
           lambda w: [OUT("#td-lbl", "fade", 0, 0.3), IN("#td-job", "up", w("RefundJob")), *ARROW("td-a2", w("Họ gọi thẳng"), 0.6),
                      OUT("#td-n100", "up", w("thành âm"), 0.2), IN("#td-nm50", "pop", w("thành âm") + 0.1, 0.35), PULSE("#td-bal", w("thành âm") + 0.5),
                      IN("#td-neg", "up", w("thành âm") + 0.9), SHAKE("#td-neg", w("thành âm") + 1.3)]),
        VB("Nguyên tắc bảo, đừng hỏi nói ngược lại. Đừng lấy dữ liệu ra để quyết định. Hãy bảo object tự làm. Quy tắc nằm trong withdraw, và ai gọi cũng phải đi qua cửa đó.",
           "Tell, Don't Ask: đừng lấy dữ liệu ra tự quyết, hãy bảo object làm. Quy tắc nằm trong withdraw().",
           lambda w: [OUT(vS("td-svc", "td-job", "td-acc", "td-neg", "td-bal", "td-n100", "td-nm50") + ", " + vAR("td-a1", "td-a2"), "blur", 0, 0.5),
                      IN("#td-rich", "zoomin", w("Hãy bảo"), 0.7), IN("#td-w1", "left", w("Quy tắc nằm")), *ARROW("td-a3", w("Quy tắc nằm") + 0.5, 0.5),
                      IN("#td-w2", "left", w("ai gọi")), *ARROW("td-a4", w("ai gọi") + 0.5, 0.5), PULSE("#td-rich", w("đi qua"))]),
        VB("Gọi withdraw năm trăm khi chỉ có một trăm, thì ném lỗi, và số dư vẫn giữ nguyên một trăm.",
           "withdraw(500) khi chỉ có 100: ném IllegalStateException, số dư vẫn 100.",
           lambda w: [IN("#td-err", "up", w("thì ném lỗi")), SHAKE("#td-err", w("thì ném lỗi") + 0.4), PULSE("#td-rich", w("số dư vẫn")),
                      IN("#td-keep", "up", w("giữ nguyên"))]),
        VB("Vì thế đừng sinh setter cho mọi field. Mỗi setter là một cửa không có người gác.",
           "Đừng sinh setter cho mọi field: mỗi setter là một cửa không có người gác.",
           lambda w: [OUT(vS("td-rich", "td-w1", "td-w2", "td-err", "td-keep") + ", " + vAR("td-a3", "td-a4"), "blur", 0, 0.5),
                      TYPE("#td-t1", 0.5, 0.04), IN("#td-t2", "blur", w("Mỗi setter"))]),
    ]),
    # ------------------------------------------------------------ liskov + strategy
    dict(id="lsp", world=(1920, 1080), hud="", cam="".join([
        v_head("ls", "Phần 11 · Liskov và Strategy", "Khi nào kế thừa sai?"),
        v_panel("ls-pn"),
        v_card("ls-k1", 130, 330, 760, 360, "Kế thừa", "có thể làm hỏng logic", "red", 60, 38),
        v_card("ls-k2", 1030, 330, 760, 360, "Một quy tắc", "kiểm tra trước khi viết extends", "green", 60, 34),
        v_tag("ls-rule", 100, 250, 1720, 130, "Thay con vào chỗ cha, code vẫn phải đúng", "violet", 46),
        v_tag("ls-rect", 160, 450, 560, 130, "Rectangle", "cyan", 52),
        v_tag("ls-sq", 160, 720, 560, 130, "Square", "violet", 52),
        chip("ls-ext", 480, 640, "extends", "violet"),
        v_card("ls-math", 900, 450, 920, 400, "Trong toán", "hình vuông là hình chữ nhật", "green", 56, 42),
        v_cbox("ls-code", 100, 290, 800, "Client.java", "r.setWidth(5);\nr.setHeight(4);\n// mong đợi: area = 20", "violet", 40),
        v_tag("ls-ok", 1000, 290, 820, 130, "Rectangle: area = 20", "green", 44),
        v_tag("ls-bad", 1000, 460, 820, 130, "Square: area = 16", "red", 44),
        v_tag("ls-why", 1000, 640, 820, 130, "Square đổi cả hai chiều cùng lúc", "amber", 34),
        v_mono("ls-shape", 560, 240, 800, 190, "«interface»", "Shape", "area()", "violet", 64),
        v_tag("ls-r2", 160, 560, 620, 120, "Rect", "cyan", 52),
        v_tag("ls-s2", 1140, 560, 620, 120, "Sq", "cyan", 52),
        v_tag("ls-o1", 160, 740, 720, 110, "Rect 5×4: area = 20", "green", 40),
        v_tag("ls-o2", 1040, 740, 720, 110, "Sq 4: area = 16", "green", 40),
        v_mono("ls-ord", 560, 230, 800, 150, "", "Order", "FeePolicy fee", "cyan", 56),
        v_mono("ls-pol", 560, 430, 800, 150, "«interface»", "FeePolicy", "", "violet", 56),
        v_tag("ls-std", 160, 650, 760, 120, "Standard", "cyan", 48),
        v_tag("ls-exp", 1000, 650, 760, 120, "Express", "green", 48),
        v_tag("ls-f1", 160, 810, 760, 100, "Standard 10km = 35.000", "green", 36),
        v_tag("ls-f2", 1000, 810, 760, 100, "Express 10km = 65.000", "green", 36),
        el("ls-t1", 0, 400, 1920, None, letters("Đổi một phần hành vi"), "take r"),
        el("ls-t2", 0, 540, 1920, None, "giữ Strategy trong field, đừng thêm lớp con", "take-sm r"),
        wires(arrow("ls-a1", [(440, 715), (440, 585)], "violet", True),
              arrow("ls-a2", [(470, 555), (700, 435)], "violet", True), arrow("ls-a3", [(1450, 555), (1220, 435)], "violet", True),
              arrow("ls-a4", [(960, 385), (960, 425)], "cyan"),
              arrow("ls-a5", [(540, 645), (700, 585)], "violet", True), arrow("ls-a6", [(1380, 645), (1220, 585)], "violet", True)),
    ]), beats=[
        VB("Ở phần ba ta thấy kế thừa có thể làm hỏng logic. Giờ ta có một quy tắc để kiểm tra trước khi viết extends.",
           "Kế thừa có thể làm hỏng logic. Có một quy tắc để kiểm tra trước khi extends.",
           lambda w: [IN("#ls-eye", "blur"), TYPE("#ls-q", 0.2, 0.05), *v_shrink("ls", 1.2), IN("#ls-pn", "fade", 1.6, 0.6),
                      IN("#ls-k1", "left", max(1.9, w("kế thừa"))), IN("#ls-k2", "right", max(2.8, w("Giờ ta có")))]),
        VB("Đó là nguyên tắc Liskov. Ở đâu dùng lớp cha, thay bằng lớp con thì code vẫn phải đúng. Ví dụ kinh điển: trong toán, hình vuông là hình chữ nhật, nên Square kế thừa Rectangle.",
           "Liskov: thay class con vào chỗ cha, code vẫn đúng. Ví dụ: Square extends Rectangle.",
           lambda w: [OUT("#ls-k1, #ls-k2", "blur", 0, 0.5), IN("#ls-rule", "zoomin", w("Đó là nguyên tắc"), 0.7),
                      IN("#ls-rect", "down", w("Ví dụ kinh điển")), IN("#ls-sq", "up", w("Square kế thừa")), *ARROW("ls-a1", w("Square kế thừa") + 0.3, 0.5),
                      IN("#ls-ext", "blur", w("Square kế thừa") + 0.5), IN("#ls-math", "left", w("trong toán"))]),
        VB("Nhưng code dùng Rectangle gọi set width năm, rồi set height bốn, và mong diện tích là hai mươi. Với Rectangle thì đúng. Với Square thì ra mười sáu.",
           "setWidth(5) rồi setHeight(4), mong area = 20. Rectangle đúng, Square ra 16.",
           lambda w: [OUT(vS("ls-rect", "ls-sq", "ls-ext", "ls-math", "ls-rule") + ", " + vAR("ls-a1"), "blur", 0, 0.5),
                      IN("#ls-code", "left", w("Nhưng code")), IN("#ls-ok", "right", w("Với Rectangle")), IN("#ls-bad", "right", w("Với Square")),
                      SHAKE("#ls-bad", w("Với Square") + 0.8), IN("#ls-why", "up", w("Với Square") + 1.4)]),
        VB("Cách sửa: bỏ quan hệ kế thừa. Cho cả hai cùng implement interface Shape. Không còn setter để ai làm sai ý nghĩa, mà đa hình vẫn còn nguyên.",
           "Sửa: bỏ extends, cho Rect và Sq cùng implement interface Shape.",
           lambda w: [OUT("#ls-code, #ls-ok, #ls-bad, #ls-why", "blur", 0, 0.5), IN("#ls-shape", "down", w("Cho cả hai")),
                      IN("#ls-r2", "up", w("implement")), *ARROW("ls-a2", w("implement") + 0.4, 0.5), IN("#ls-s2", "up", w("interface Shape")), *ARROW("ls-a3", w("interface Shape") + 0.4, 0.5),
                      IN("#ls-o1", "pop", w("Không còn setter")), IN("#ls-o2", "pop", w("mà đa hình"))]),
        VB("Còn khi muốn đổi một phần hành vi, như cách tính phí giao hàng, đừng tạo lớp con. Tách phần đó thành interface Strategy, và Order giữ nó trong field. Giao hàng Standard mười ki lô mét là ba mươi lăm nghìn, Express là sáu mươi lăm nghìn.",
           "Tách thành interface Strategy, Order giữ trong field. Standard 35.000, Express 65.000.",
           lambda w: [OUT(vS("ls-shape", "ls-r2", "ls-s2", "ls-o1", "ls-o2") + ", " + vAR("ls-a2", "ls-a3"), "blur", 0, 0.5),
                      IN("#ls-ord", "down", 0.7), IN("#ls-pol", "up", w("Tách phần đó")), *ARROW("ls-a4", w("Tách phần đó") + 0.4, 0.4),
                      IN("#ls-std", "up", w("Giao hàng Standard")), *ARROW("ls-a5", w("Giao hàng Standard") + 0.4, 0.4), IN("#ls-f1", "pop", w("mười ki lô")),
                      IN("#ls-exp", "up", w("Express là")), *ARROW("ls-a6", w("Express là") + 0.4, 0.4), IN("#ls-f2", "pop", w("sáu mươi"))]),
        VB("Ghi nhớ: muốn đổi một phần hành vi, hãy giữ Strategy trong field, đừng thêm lớp con.",
           "Muốn đổi một phần hành vi: giữ Strategy trong field, đừng thêm class con.",
           lambda w: [OUT(vS("ls-ord", "ls-pol", "ls-std", "ls-exp", "ls-f1", "ls-f2") + ", " + vAR("ls-a4", "ls-a5", "ls-a6"), "blur", 0, 0.5),
                      TYPE("#ls-t1", 0.5, 0.04), IN("#ls-t2", "blur", w("hãy giữ"))]),
    ]),
    # ------------------------------------------------------------ rental capstone
    dict(id="cap", world=(1920, 1080), hud="", cam="".join([
        v_head("cp", "Phần 12 · Ghép lại", "Hệ thống thuê xe"),
        v_panel("cp-pn"),
        v_card("cp-k1", 130, 330, 760, 360, "Hệ thống nhỏ", "thuê xe", "cyan", 60, 44),
        v_card("cp-k2", 1030, 330, 760, 360, "Mỗi ý", "làm đúng một việc", "green", 60, 40),
        v_mono("cp-veh", 100, 230, 780, 200, "abstract", "Vehicle", "dailyRate()", "violet", 60),
        v_card("cp-mb", 100, 520, 370, 190, "Motorbike", "150.000 / ngày", "green", 44, 30),
        v_card("cp-car", 510, 520, 370, 190, "Car", "700.000 / ngày", "green", 52, 30),
        v_mono("cp-bk", 1040, 230, 780, 150, "", "Booking", "private fields", "cyan", 56),
        v_mono("cp-dis", 1040, 450, 780, 150, "«interface»", "Discount", "", "violet", 56),
        v_tag("cp-d1", 1040, 670, 300, 110, "Không giảm", "cyan", 32),
        v_tag("cp-d2", 1370, 670, 450, 110, "Giảm 10% từ 7 ngày", "cyan", 32),
        e_con("cp-con", 260, 330, 1400, ["> Motorbike 3 ngày: 450.000", "> Car 3 ngày: 2.100.000", "> Car 7 ngày, giảm tuần: 4.410.000"], 48),
        v_mono("cp-bk2", 560, 250, 800, 150, "", "Booking", "private fields", "cyan", 56),
        v_err("cp-e1", 100, 500, 1720, "✕ to không sau from: IllegalArgumentException", 38),
        v_err("cp-e2", 100, 680, 1720, "✕ cancel() rồi total(): IllegalStateException", 38),
        el("cp-t1", 0, 400, 1920, None, letters("Thêm kiểu mới = thêm class mới"), "take r"),
        el("cp-t2", 0, 540, 1920, None, "không sửa code cũ chạy tốt", "take-sm r"),
        wires(arrow("cp-a1", [(285, 515), (330, 435)], "violet", True), arrow("cp-a2", [(695, 515), (650, 435)], "violet", True),
              arrow("cp-a3", [(1035, 305), (885, 330)], "cyan"), arrow("cp-a4", [(1430, 385), (1430, 445)], "cyan"),
              arrow("cp-a5", [(1190, 665), (1300, 605)], "violet", True), arrow("cp-a6", [(1600, 665), (1520, 605)], "violet", True)),
    ]), beats=[
        VB("Giờ ghép các mảnh vào một hệ thống nhỏ: thuê xe. Mỗi ý làm đúng một việc.",
           "Ghép các mảnh vào một hệ thống nhỏ: thuê xe. Mỗi ý làm đúng một việc.",
           lambda w: [IN("#cp-eye", "blur"), TYPE("#cp-q", 0.2, 0.05), *v_shrink("cp", 1.2), IN("#cp-pn", "fade", 1.6, 0.6),
                      IN("#cp-k1", "left", max(1.9, w("hệ thống"))), IN("#cp-k2", "right", max(2.8, w("Mỗi ý")))]),
        VB("Trừu tượng và kế thừa: lớp trừu tượng Vehicle khai báo daily rate. Xe máy Motorbike trả một trăm năm mươi nghìn một ngày. Ô tô Car trả bảy trăm nghìn.",
           "Vehicle khai báo dailyRate(): Motorbike 150.000, Car 700.000 mỗi ngày.",
           lambda w: [OUT("#cp-k1, #cp-k2", "blur", 0, 0.5), IN("#cp-veh", "down", w("lớp trừu tượng")),
                      IN("#cp-mb", "up", w("Xe máy")), *ARROW("cp-a1", w("Xe máy") + 0.3, 0.5), IN("#cp-car", "up", w("Ô tô Car")), *ARROW("cp-a2", w("Ô tô Car") + 0.3, 0.5)]),
        VB("Booking chỉ gọi daily rate của xe, nên không cần biết xe nào. Còn giảm giá là interface Discount: không giảm, hoặc giảm mười phần trăm khi thuê từ bảy ngày. Booking giữ nó trong field.",
           "Booking chỉ gọi vehicle.dailyRate(). Giảm giá là Strategy: Discount giữ trong field của Booking.",
           lambda w: [IN("#cp-bk", "right", 0.4), *ARROW("cp-a3", w("Booking chỉ gọi") + 0.3, 0.6), PULSE("#cp-veh", w("nên không cần")),
                      IN("#cp-dis", "up", w("Còn giảm giá")), *ARROW("cp-a4", w("Còn giảm giá") + 0.4, 0.5), IN("#cp-d1", "up", w("không giảm,")), *ARROW("cp-a5", w("không giảm,") + 0.3, 0.4),
                      IN("#cp-d2", "up", w("hoặc giảm")), *ARROW("cp-a6", w("hoặc giảm") + 0.3, 0.4), PULSE("#cp-bk", w("Booking giữ"))]),
        VB("Kết quả đã chạy thật. Xe máy ba ngày là bốn trăm năm mươi nghìn. Ô tô ba ngày là hai triệu một trăm nghìn. Ô tô bảy ngày được giảm tuần, còn bốn triệu bốn trăm mười nghìn.",
           "Đã chạy thật: Motorbike 3 ngày 450.000, Car 3 ngày 2.100.000, Car 7 ngày 4.410.000.",
           lambda w: [OUT(vS("cp-veh", "cp-mb", "cp-car", "cp-bk", "cp-dis", "cp-d1", "cp-d2") + ", " + vAR("cp-a1", "cp-a2", "cp-a3", "cp-a4", "cp-a5", "cp-a6"), "blur", 0, 0.5),
                      IN("#cp-con", "up", 0.6), IN("#cp-con-1", "type1", w("Xe máy ba"), 0.3), IN("#cp-con-2", "type1", w("Ô tô ba"), 0.3), IN("#cp-con-3", "type1", w("Ô tô bảy"), 0.3)]),
        VB("Cuối cùng là đóng gói. Booking từ chối khoản to không sau from, và sau khi hủy thì total ném lỗi. Nên không bao giờ có booking ở trạng thái vô nghĩa.",
           "Encapsulation: to không sau from và total() sau cancel() đều ném lỗi.",
           lambda w: [OUT("#cp-con", "blur", 0, 0.5), IN("#cp-bk2", "down", 0.6), IN("#cp-e1", "up", w("Booking từ chối")), SHAKE("#cp-e1", w("Booking từ chối") + 0.5),
                      IN("#cp-e2", "up", w("sau khi hủy")), SHAKE("#cp-e2", w("sau khi hủy") + 0.5), PULSE("#cp-bk2", w("Nên không bao giờ"))]),
        VB("Cần thêm xe tải hay kiểu giảm giá mới? Chỉ thêm class mới, không sửa code cũ.",
           "Thêm Truck hay giảm giá mới: chỉ thêm class, không sửa code cũ.",
           lambda w: [OUT("#cp-bk2, #cp-e1, #cp-e2", "blur", 0, 0.5), TYPE("#cp-t1", 0.5, 0.04), IN("#cp-t2", "blur", w("không sửa"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        v_head("ou", "Tổng kết", "Tóm tắt trong 7 ý"),
        v_panel("ou-pn"),
        *[v_card(f"ou-c{i}", 100 + i * 437, 330, 410, 420, en, vi, "cyan", 46, 32, ico)
          for i, (ico, en, vi) in enumerate([("lock", "Encapsulation", "bảo vệ quy tắc dữ liệu"), ("plug", "Abstraction", "giấu độ phức tạp"),
                                              ("tree", "Inheritance", "tái sử dụng theo is-a"), ("shapes", "Polymorphism", "đổi hành vi lúc runtime")])],
        *[v_card(f"ou-d{i}", 100 + i * 590, 330, 540, 420, en, vi, "violet", 50, 34, ico)
          for i, (ico, en, vi) in enumerate([("shield", "Tell, Don't Ask", "quy tắc nằm cùng dữ liệu"), ("eq", "Liskov", "con thay cha vẫn đúng"),
                                              ("split", "Strategy", "đổi hành vi bằng composition")])],
        v_tag("ou-f1", 130, 330, 300, 150, "Là gì?", "cyan", 40),
        v_tag("ou-f2", 530, 330, 520, 150, "Giải quyết vấn đề gì?", "cyan", 36),
        v_tag("ou-f3", 1150, 330, 640, 150, "Ví dụ trong dự án của bạn", "green", 36),
        v_card("ou-cta", 260, 590, 1400, 260, "Mở bài học tương tác", "để làm quiz và tự tay thử từng ví dụ", "green", 64, 40),
        wires(arrow("ou-a1", [(445, 405), (515, 405)], "muted"), arrow("ou-a2", [(1065, 405), (1135, 405)], "muted")),
    ]), beats=[
        VB("Tóm lại có bảy ý cần nhớ. Bốn tính chất: đóng gói bảo vệ quy tắc dữ liệu, trừu tượng giấu độ phức tạp, kế thừa để tái sử dụng, và đa hình đổi hành vi lúc chạy.",
           "4 tính chất: Encapsulation · Abstraction · Inheritance · Polymorphism.",
           lambda w: [IN("#ou-eye", "blur"), TYPE("#ou-q", 0.2, 0.05), *v_shrink("ou", 1.2), IN("#ou-pn", "fade", 1.6, 0.6),
                      IN("#ou-c0", "pop", max(1.9, w("đóng gói"))), IN("#ou-c1", "pop", w("trừu tượng giấu")), IN("#ou-c2", "pop", w("kế thừa để")), IN("#ou-c3", "pop", w("đa hình đổi"))]),
        VB("Ba ý nâng cao: bảo, đừng hỏi, để quy tắc nằm cùng dữ liệu. Nguyên tắc Liskov, con thay cha vẫn phải đúng. Và Strategy, đổi hành vi bằng composition.",
           "3 ý senior: Tell, Don't Ask · Liskov · Strategy.",
           lambda w: [OUT("#ou-c0, #ou-c1, #ou-c2, #ou-c3", "blur", 0, 0.5), IN("#ou-d0", "pop", w("Ba ý") + 0.4), IN("#ou-d1", "pop", w("Nguyên tắc Liskov")), IN("#ou-d2", "pop", w("Và Strategy"))]),
        VB("Khi trả lời, hãy đi theo khung: là gì, giải quyết vấn đề gì, và ví dụ trong dự án của bạn.",
           "Khi trả lời, đi theo khung: Là gì → Giải quyết vấn đề gì → Ví dụ trong dự án của bạn.",
           lambda w: [OUT("#ou-d0, #ou-d1, #ou-d2", "blur", 0, 0.5), IN("#ou-f1", "up", w("là gì")), *ARROW("ou-a1", w("là gì") + 0.4, 0.4),
                      IN("#ou-f2", "up", w("giải quyết")), *ARROW("ou-a2", w("giải quyết") + 0.8, 0.4), IN("#ou-f3", "pop", w("ví dụ trong"))]),
        VB("Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
           "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
           lambda w: [IN("#ou-cta", "zoomin", 0.3, 0.7), PULSE("#ou-f3", w("tự tay"))]),
    ]),
]


def v_squeeze(scenes, scenes_file):
    """After retiming, pull reveals earlier until the last motion of each beat ends inside its narration."""
    beats = Path(scenes_file).parent / ".tts" / "beats.json"
    if not beats.exists():
        return
    known = {b["spoken"]: b["d"] for b in json.loads(beats.read_text(encoding="utf-8"))}
    for sc in scenes:
        for spoken, _caption, actions in sc["beats"]:
            if spoken not in known:
                continue
            for _ in range(8):
                last = max((a.get("d", 0) + a.get("dur", 0.5) for a in actions), default=0)
                if last <= known[spoken] + 0.4:
                    break
                for a in actions:
                    a["d"] = round(a.get("d", 0) * 0.92, 2)


V_SCENES = [s for s in SCENES if s["id"] in ("hook", "enc", "ibas", "inh", "pbas", "ovo", "abs", "ivsa", "pbv", "poly", "tda", "lsp", "cap", "outro")]
fit_to_audio(V_SCENES, __file__)
v_squeeze(V_SCENES, __file__)
