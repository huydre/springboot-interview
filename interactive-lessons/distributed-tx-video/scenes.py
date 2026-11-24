"""Distributed transactions explainer: dual write, 2PC, saga, transactional outbox with inbox, saga isolation and TCC.

Facts come from the lesson (web/src/data/lessons/distributed-tx.ts). The outbox outputs were run on JDK 21, Spring Boot 3.5,
PostgreSQL 16 and Kafka 3.9.1, each step a separate JVM killed with kill -9 at a marked point:
dual write: "COMMITTED order 1 (naive, event not sent yet)", kill -9, DB "1 alice PENDING", "TOPIC order-events holds 0 record(s)";
outbox: "COMMITTED order 2 with its outbox row", kill -9, outbox "2 published_at=NULL";
relay: "RELAY sent outbox 94d744c7... key=2 -> partition 2 offset 0", kill -9 before marking, new relay "offset 1" then "marked ... published";
inbox consumer: offset 0 reserved stock for order 2, offset 1 "already processed, ignored", 1 reservation, 1 processed_message.
2PC, saga isolation and TCC are described, not run. Theme: mono. No flow dots, comets or glows: arrows are drawn only.
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


def AW(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head; no travelling light."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(label, text, lw=None):
    style = f"font-size:40px;min-width:{lw}px" if lw else "font-size:40px"
    return f'<span class="mono big" style="{style}">{esc(label)}</span><span style="font-size:34px">{esc(text)}</span>'


def head(p, eyebrow, title, size=80):
    return (el(f"{p}-eye", 310, 150, 1300, None, eyebrow, "eyebrow r")
            + el(f"{p}-q", 0, 220, 1920, None, letters(title), "h1 r", f"font-size:{size}px"))


def shrink(p, d):
    return [TO(f"#{p}-eye", {"y": -130}, d, 0.8), TO(f"#{p}-q", {"y": -177, "scale": 0.68}, d, 0.8)]


def bcode(src, size=32):
    return code(src).replace("<pre>", f'<pre style="font-size:{size}px">', 1)


def cbox(id_, x, y, w, title, src, tone="violet", size=32):
    return box(id_, x, y, w, None, win(title) + bcode(src, size), tone, "code")


def pbox(id_, x, y, w, title, text, tone="violet", size=28):
    """Plain monospace box (no Java colouring) for pseudo code."""
    return box(id_, x, y, w, None, win(title) + f'<pre style="font-size:{size}px;line-height:1.5">{esc(text)}</pre>', tone, "code")


def logbox(id_, x, y, w, title, lines, tone="muted", size=28):
    """Log window whose lines (ids <id>-1..n) are revealed one by one with IN(..., "type1")."""
    rows = "".join(f'<div id="{id_}-{i}" class="r" style="white-space:pre">{esc(l)}</div>' for i, l in enumerate(lines, 1))
    return box(id_, x, y, w, None,
               win(title) + f'<div class="mono" style="font-size:{size}px;line-height:1.5;padding:18px 30px;color:#dfe2ea">{rows}</div>',
               tone, "code")


def tag(id_, x, y, w, h, text, tone="cyan", size=32):
    return box(id_, x, y, w, h, f'<span class="mono" style="font-size:{size}px;font-weight:600;text-align:center">{esc(text)}</span>', tone)


def titled(id_, x, y, w, h, top, main, sub="", tone="cyan", ms=40):
    inner = (f'<span class="mono" style="font-size:26px;color:var(--muted)">{esc(top)}</span>' if top else "")
    inner += f'<span class="mono" style="font-size:{ms}px;font-weight:700;text-align:center">{esc(main)}</span>'
    inner += f'<span class="mono" style="font-size:26px;color:var(--muted);text-align:center">{esc(sub)}</span>' if sub else ""
    return box(id_, x, y, w, h, inner, tone, "col")


def bigerr(id_, x, y, w, html_text, size=32):
    return el(id_, x, y, w, None, html_text, "err r", f"font-size:{size}px;line-height:1.35")


def note(id_, x, y, w, text, tone="green", size=34, align="left"):
    return el(id_, x, y, w, None, esc(text).replace("\n", "<br>"), f"note {tone} {align} r", f"font-size:{size}px;line-height:1.35")


def rule(id_, main, sub, tone="violet"):
    return box(id_, 160, 470, 1600, 300,
               f'<b style="font-size:58px;letter-spacing:-0.02em;text-align:center">{esc(main)}</b><span style="font-size:36px;text-align:center;color:var(--muted)">{esc(sub)}</span>',
               tone, "card")


def card(id_, x, y, w, h, title, desc, tone="cyan", ts=40, ds=29):
    return box(id_, x, y, w, h, f'<b style="font-size:{ts}px">{esc(title)}</b><span style="font-size:{ds}px;color:var(--muted);text-align:center;line-height:1.35">{esc(desc)}</span>', tone, "card")


def take(p, big, small):
    return (el(f"{p}-t1", 0, 400, 1920, None, letters(big), "take r")
            + el(f"{p}-t2", 0, 540, 1920, None, esc(small), "take-sm r"))


def show_take(p, d, d2):
    return [TYPE(f"#{p}-t1", d, 0.04), IN(f"#{p}-t2", "blur", d2)]


# ------------------------------------------------------------------ hook
HK_BOX = [("Order", "order_db", "cyan"), ("Inventory", "inventory_db", "cyan"), ("Payment", "payment_db", "cyan"), ("Kafka", "order-events", "violet")]
HK_TAG = ["Dual write", "2PC", "Saga", "Outbox + inbox", "TCC"]

hk1 = "Đặt hàng chạm ba service: Order, Inventory và Payment, mỗi service một database riêng, cộng thêm Kafka. Làm sao để tất cả nhất quán?"
hk2 = "Transactional quen thuộc chỉ bao được một connection tới một database. Những hệ thống còn lại, nó không với tới."
hk3 = "Video này đi qua dual write, two phase commit, saga, outbox cùng inbox, và TCC, rồi cách chọn giải pháp khi phỏng vấn."
hk4 = "Ý chính: không có rollback chung, nên phải chọn đúng cơ chế cho từng chỗ."

# ------------------------------------------------------------------ problem
PB_DB = [("order_db", "green", "✓ có"), ("inventory_db", "muted", "✕ không"), ("payment_db", "muted", "✕ không"), ("Kafka", "muted", "✕ không")]
PB_LOG = ["OrderPlacement : COMMITTED order 1 (naive, event not sent yet)",
          "Crash          : PAUSED at after-commit (waiting for kill -9)",
          "  [kill -9]",
          "  orders in DB: 1 alice PENDING",
          "TopicDump      : TOPIC order-events holds 0 record(s)"]

pb1 = "Transactional hứa rằng mọi câu lệnh commit cùng nhau, hoặc rollback cùng nhau. Nhưng lời hứa đó chỉ đúng trong một connection tới một database."
pb2 = ("Đặt hàng chạm ba service, mỗi service một database. Order commit xong mà Payment lỗi, thì đơn đã nằm trong database, "
       "không có rollback nào kéo về được nữa. Kafka cũng có transaction riêng, không chung với database.")
pb3 = ("Kể cả trong một service, ghi database rồi gửi lên Kafka là hai lần ghi không có transaction chung. Đó là dual write. "
       "Gửi trong transaction rồi database rollback: consumer xử lý một đơn không tồn tại, gọi là event ma. "
       "Commit rồi mới gửi thì nghe an toàn hơn, nhưng crash ở giữa là mất event.")
pb4 = ("Đã chạy thử, mỗi bước là một JVM riêng. Commit đơn, rồi kill trừ chín ngay trước lệnh send. "
       "Database có đơn số một của alice, trạng thái Pending. Còn topic order events: không có record nào.")
pb5 = ("Bẫy hay gặp: bật Kafka transaction cũng không cứu được, vì nó không chung transaction với Postgres. "
       "Nhớ chuỗi này: mỗi bước commit riêng, lỗi giữa chừng để lại trạng thái nửa vời.")

# ------------------------------------------------------------------ two-phase-commit
tp1 = ("Cách đúng sách để nhiều database commit cùng nhau là two phase commit. Chuẩn cho database và broker gọi là XA, "
       "trong Java là JTA, cần một transaction manager như Atomikos hoặc Narayana.")
tp2 = ("Pha một, prepare: coordinator hỏi từng participant commit được không. "
       "Participant ghi đủ dữ liệu xuống đĩa, giữ nguyên lock, rồi bỏ phiếu yes hoặc no.")
tp3 = ("Pha hai: tất cả yes thì coordinator ghi quyết định vào log của nó, rồi bảo mọi bên commit. "
       "Chỉ một no hoặc timeout là mọi bên rollback.")
tp4 = ("Điểm then chốt: sau khi trả lời yes, participant mất quyền tự quyết. Coordinator chết lúc này thì participant ở trạng thái in doubt. "
       "Không được tự commit, không được tự rollback, giữ lock tới khi coordinator sống lại. Giao dịch khác chạm các dòng đó đứng chờ.")
tp5 = ("Vì vậy microservices gần như không dùng. Blocking khi coordinator chết. Coordinator là nút cổ chai. "
       "Kafka, phần lớn NoSQL và API thanh toán không tham gia XA. Và mọi service bị buộc chung một transaction manager.")
tp6 = ("Two phase commit vẫn có chỗ: hệ thống nguyên khối chạm hai database, hoặc bên trong một database phân tán. "
       "Khi phỏng vấn, đừng chỉ nói chậm. Hãy nói in doubt giữ lock, và Kafka không tham gia XA.")

# ------------------------------------------------------------------ saga
SG_STEP = [("B1 · Order", "PENDING", "", "cyan"), ("B2 · Inventory", "giữ hàng", "", "cyan"),
           ("B3 · Payment", "thu tiền", "pivot", "amber"), ("B4 · Order", "APPROVED", "", "green"),
           ("B5 · Shipping", "vận đơn, email", "", "green")]
SG_X = [110 + i * 350 for i in range(5)]

sg1 = ("Saga chia nghiệp vụ thành chuỗi local transaction, mỗi service commit phần của mình ngay. Bước sau lỗi thì chạy bước bù theo thứ tự ngược. "
       "Bước bù không phải rollback: hoàn tiền chứ không xoá giao dịch thu, chuyển đơn sang Cancelled chứ không xoá đơn.")
sg2 = ("Ví dụ đặt hàng: tạo đơn Pending, giữ hàng, thu tiền, duyệt đơn, rồi tạo vận đơn và gửi email. "
       "Tạo đơn bù bằng Cancelled, giữ hàng bù bằng nhả hàng. Hai bước cuối chỉ retry.")
sg3 = "Thẻ bị từ chối ở bước thu tiền: saga nhả hàng trước, rồi chuyển đơn sang Cancelled với lý do Payment Declined."
sg4 = ("Thu tiền là bước pivot, điểm không quay lại. Trước pivot chỉ đặt bước bù được. Pivot thành công thì saga đi tới cùng, "
       "sau đó chỉ còn retry. Email đã gửi thì không thu hồi được, nên đặt sau pivot.")
sg5 = ("Không có ai bù cho bước bù. Nên bước bù phải retry tới khi xong, phải idempotent, và chịu được bước gốc chưa từng xảy ra. "
       "Lỗi mãi thì sang Compensation Failed và bắn alert.")
sg6 = ("Ai điều phối? Choreography: mỗi service nghe event rồi phản ứng, ít code, nhưng nhiều bước thì luồng rải rác, khó debug. "
       "Orchestration: một state machine ra lệnh, lưu trạng thái trong bảng saga instance, đơn kẹt ở đâu đọc một bảng là biết.")
sg7 = "Dù kiểu nào, mỗi bước commit rồi gửi message lại chính là dual write. Vì vậy saga thực tế luôn đi cùng outbox."

CHOREO = ("order:     tạo đơn → OrderCreated\n"
          "inventory: nghe OrderCreated → giữ hàng\n"
          "           → StockReserved\n"
          "payment:   nghe StockReserved → thu tiền\n"
          "           → PaymentCompleted | PaymentFailed")
ORCH = ("start         → ReserveStock    RESERVING\n"
        "StockReserved → ChargePayment   CHARGING\n"
        "PaymentOk     → Ship            APPROVED\n"
        "PaymentFailed → ReleaseStock    COMPENSATING\n"
        "StockReleased → cancel(reason)  CANCELLED")

# ------------------------------------------------------------------ outbox
OB_LOG = ["OrderPlacement : COMMITTED order 2 with its outbox row",
          "  [kill -9]   outbox: 2 published_at=NULL",
          "OutboxRelay : RELAY sent outbox 94d744c7... key=2 -> partition 2 offset 0",
          "  [kill -9]   outbox: 2 published_at=NULL",
          "OutboxRelay : RELAY sent outbox 94d744c7... key=2 -> partition 2 offset 1",
          "OutboxRelay : RELAY marked outbox 94d744c7... published"]
OB_RES = ["CONSUMER offset 0 message 94d744c7...",
          "  -> reserved stock for order 2",
          "CONSUMER offset 1 message 94d744c7...",
          "  already processed, ignored",
          "stock_reservation: 1 row(s)",
          "processed_message: 1 row(s)"]
INBOX = ('@KafkaListener(topics = "order-events")\n'
         "@Transactional\n"
         "public void on(ConsumerRecord<String, String> rec) {\n"
         '  int inserted = jdbc.update("""\n'
         "    INSERT INTO processed_message(message_id, consumer)\n"
         "    VALUES (?, 'inventory') ON CONFLICT DO NOTHING\"\"\", id);\n"
         "  if (inserted == 0) return;   // đã xử lý\n"
         '  jdbc.update("INSERT INTO stock_reservation ...");\n'
         "}")

ob1 = ("Transactional outbox: thay vì gửi thẳng lên Kafka, ta ghi event vào bảng outbox, trong cùng transaction với đơn. "
       "Đơn và event commit cùng nhau hoặc cùng không. Một tiến trình relay đọc bảng outbox rồi publish lên Kafka.")
ob2 = ("Đã chạy thử: tạo đơn qua outbox, rồi kill trừ chín ngay sau commit. Bảng outbox vẫn còn dòng của đơn hai, published at bằng null. "
       "Việc phải gửi được nhớ trong database.")
ob3 = ("Tiếp theo, relay gửi lên Kafka ở offset không, rồi bị kill trước khi đánh dấu. Relay mới thấy dòng chưa đánh dấu, gửi lại ở offset một, "
       "rồi mới đánh dấu published.")
ob4 = ("Kết quả: topic có hai record cùng message id, cùng partition hai, vì key là aggregate id. Outbox đảm bảo ít nhất một lần, không phải đúng một lần. "
       "Thứ tự đúng là gửi, chờ ack, rồi mới đánh dấu.")
ob5 = ("Vì vậy consumer phải idempotent, bằng bảng inbox. Insert message id với on conflict do nothing, cùng transaction với việc giữ hàng. "
       "Insert được không dòng nghĩa là đã xử lý, bỏ qua.")
ob6 = ("Đã chạy: offset không giữ hàng cho đơn hai. Offset một cùng message id, bị bỏ qua. Cuối cùng chỉ một reservation. "
       "Chống trùng bằng id lấy từ outbox, vì offset thì đổi.")

# ------------------------------------------------------------------ saga-isolation
si1 = ("Saga có bù, có nhất quán sau cùng, mỗi bước đều bền vững, nhưng không có isolation. "
       "Mỗi bước commit ngay, nên service khác nhìn thấy trạng thái dở dang.")
si2 = ("Ví dụ: saga A giữ năm sản phẩm cuối. Saga B đọc thấy hết hàng và từ chối khách. Sau đó A bị bù, hàng trả về kho. "
       "B đã từ chối dựa trên dữ liệu không bao giờ thành sự thật. Đó là dirty read ở mức saga.")
si3 = ("Không có lock xuyên service, nên ta chặn bằng thiết kế nghiệp vụ. Semantic lock: cờ Pending báo dữ liệu chưa chắc chắn. "
       "Commutative updates: trừ hai rồi cộng hai, thay vì ghi đè bằng tám. Pessimistic view: sắp lại bước để giảm hậu quả. "
       "Reread value: đọc lại kèm version, đổi thì huỷ hoặc làm lại.")
si4 = ("Saga còn có thể treo, kẹt ở Charging mãi vì Payment không trả lời. Mỗi saga cần deadline, một job quét saga quá hạn, "
       "hỏi lại trạng thái rồi đi tiếp hoặc bù. Reservation cũng nên có TTL riêng.")
si5 = ("TCC là biến thể gần saga orchestration. Try chỉ giữ chỗ, ví dụ đóng băng năm trăm nghìn đồng. Confirm mới chuyển thật, Cancel thì nhả. "
       "Isolation tốt hơn saga, đổi lại mỗi service phải viết ba API.")
si6 = ("Hai bẫy của TCC. Empty cancel: Try chưa tới mà Cancel đến, Cancel vẫn trả OK. Suspension: Try tới sau Cancel thì phải bị từ chối. "
       "Và nhớ: đặt Serializable cho từng bước không cứu được saga.")

# ------------------------------------------------------------------ choose-answer
CA_ROWS = [("1 · Ranh giới", "Có thật cần phân tán? Không thì một DB, @Transactional"),
           ("2 · Nhất quán", "Chấp nhận nhất quán sau cùng: đơn đang xử lý vài giây"),
           ("3 · Saga", "Orchestration khi nhiều bước · nêu pivot và bước bù"),
           ("4 · Outbox", "Mỗi lần ghi DB rồi gửi message, kể cả orchestrator"),
           ("5 · Idempotent", "Mọi consumer, kể cả bước bù"),
           ("6 · Isolation", "PENDING, deadline, job quét, alert khi bù lỗi")]
CA_DRILL = [("Lưu đơn, báo service email, không bước nào cần bù", "Outbox"),
            ("Order, Inventory, Payment, mỗi service một database", "Saga + outbox"),
            ("Ứng dụng nguyên khối ghi hai DB Oracle, đã có JTA", "2PC / XA"),
            ("Tạo đơn và trừ kho chung một database", "@Transactional"),
            ("Chuyển tiền hai ví, không ai thấy số dư tạm âm", "TCC")]

ca1 = ("Câu hỏi mở hay gặp: đặt hàng chạm ba service, làm sao đảm bảo nhất quán? Trả lời theo thứ tự. "
       "Đầu tiên hỏi lại có thật cần phân tán không. Nếu không, một database, Transactional là xong.")
ca2 = ("Rồi chấp nhận nhất quán sau cùng. Saga cho luồng nghiệp vụ, nêu bước pivot và bước bù. Outbox cho mỗi lần ghi database rồi gửi message. "
       "Consumer idempotent ở mọi nơi. Cuối cùng là isolation và saga treo.")
ca3 = ("Thử chọn nhanh. Lưu đơn rồi báo cho email, không ai cần bù: chỉ cần outbox. Đặt hàng qua ba service: saga cộng outbox. "
       "Hệ thống nguyên khối ghi hai database Oracle, đã có JTA: two phase commit chấp nhận được.")
ca4 = "Tạo đơn và trừ kho chung một database: Transactional thường. Chuyển tiền giữa hai ví, không ai được thấy số dư tạm âm: TCC."
ca5 = ("Bẫy cuối: trả lời em dùng Seata hay Temporal, mà không nói vì sao cần saga, bước nào là pivot, event trùng xử lý thế nào. "
       "Framework là chi tiết sau cùng.")

# ------------------------------------------------------------------ outro
OU_ROWS = [("Dual write", "Ghi DB rồi gửi Kafka: event ma hoặc mất event"),
           ("2PC", "Participant in-doubt giữ lock khi coordinator chết"),
           ("Saga", "Commit local, sai thì bù ngược, thu tiền là pivot"),
           ("Outbox + inbox", "Gửi ít nhất một lần, chặn trùng bằng message_id"),
           ("Isolation", "PENDING · cộng trừ · version · deadline · TCC")]
ou1 = ("Tóm lại. Dual write: ghi database rồi gửi Kafka sẽ sinh event ma hoặc mất event. "
       "Two phase commit: participant in doubt giữ lock khi coordinator chết.")
ou2 = ("Saga: commit local, sai thì bù ngược, thu tiền là pivot. Outbox cùng inbox: gửi ít nhất một lần, chặn trùng bằng message id. "
       "Saga thiếu isolation, nên dùng Pending, cộng trừ, version và deadline.")
ou3 = "Mở bài học tương tác để làm quiz và xem lại log chạy thật nhé."


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 130, 1300, None, "Microservices · Câu hỏi phỏng vấn", "eyebrow r"),
        el("hk-q", 0, 200, 1920, None, letters("Giao dịch phân tán"), "h1 r", "font-size:112px"),
        *[titled(f"hk-b{i}", 110 + i * 440, 400, 380, 170, n, d, "", tone, 34) for i, (n, d, tone) in enumerate(HK_BOX)],
        note("hk-n", 110, 600, 900, "@Transactional chỉ bao tới đây", "green", 32),
        *[tag(f"hk-g{i}", 110 + i * 340, 720, 300, 100, t, "amber", 30) for i, t in enumerate(HK_TAG)],
        take("hk", "Không có ROLLBACK chung", "chọn đúng cơ chế cho từng chỗ"),
    ]), beats=[
        B(hk1, "Một đơn hàng, ba database và Kafka. Nhất quán bằng cách nào?",
          lambda w: [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.05),
                     IN("#hk-b0", "up", w("Order")), IN("#hk-b1", "up", w("Inventory")), IN("#hk-b2", "up", w("Payment")),
                     IN("#hk-b3", "up", w("cộng thêm Kafka"))]),
        B(hk2, "@Transactional chỉ bao một connection tới một database.",
          lambda w: [PULSE("#hk-b0", 0.3), IN("#hk-n", "up", 0.6), DIM(S("hk-b1", "hk-b2", "hk-b3"), w("Những hệ thống"), 0.3)]),
        B(hk3, "Dual write · 2PC · Saga · Outbox + inbox · TCC.",
          lambda w: [IN("#hk-g0", "pop", w("dual write")), IN("#hk-g1", "pop", w("two phase")), IN("#hk-g2", "pop", w("saga")),
                     IN("#hk-g3", "pop", w("outbox cùng")), IN("#hk-g4", "pop", w("và TCC"))]),
        B(hk4, "Không có rollback chung: chọn đúng cơ chế cho từng chỗ.",
          lambda w: [OUT(S("hk-eye", "hk-q", "hk-b0", "hk-b1", "hk-b2", "hk-b3", "hk-n", *[f"hk-g{i}" for i in range(5)]), "blur", 0, 0.5),
                     *show_take("hk", 0.4, w("nên phải"))]),
    ]),
    # ------------------------------------------------------------ problem
    dict(id="problem", world=(1920, 1080), hud="", cam="".join([
        head("pb", "Phần 1 · Vấn đề", "Một đơn hàng, ba database"),
        rule("pb-rule", "@Transactional: một connection, một database", "Mọi câu lệnh commit cùng nhau hoặc rollback cùng nhau, chỉ trong phạm vi đó"),
        titled("pb-c", 710, 240, 500, 130, "", "@Transactional", "", "green", 40),
        *[titled(f"pb-d{i}", 110 + i * 440, 520, 380, 150, mark, n, "", tone, 34) for i, (n, tone, mark) in enumerate(PB_DB)],
        wires(arrow("pb-a0", [(880, 375), (310, 515)], "green"),
              arrow("pb-a1", [(930, 375), (740, 515)], "muted", True),
              arrow("pb-a2", [(990, 375), (1180, 515)], "muted", True),
              arrow("pb-a3", [(1040, 375), (1610, 515)], "muted", True)),
        note("pb-n", 110, 730, 1700, "Ranh giới transaction là ranh giới database", "green", 36, "center"),
        card("pb-k0", 110, 270, 820, 330, "Send trong transaction, rồi rollback", "message đã đi, consumer xử lý một đơn không tồn tại: event ma", "red"),
        card("pb-k1", 990, 270, 820, 330, "Commit rồi mới send", "crash ở giữa: đơn có thật, event mất vĩnh viễn", "red"),
        tag("pb-s0", 110, 240, 440, 110, "INSERT đơn", "cyan", 32),
        tag("pb-s1", 660, 240, 360, 110, "COMMIT", "green", 32),
        tag("pb-s2", 1130, 240, 680, 110, "kafkaTemplate.send(...)", "muted", 32),
        wires(arrow("pb-f0", [(555, 295), (655, 295)], "muted"), arrow("pb-f1", [(1025, 295), (1125, 295)], "muted")),
        bigerr("pb-x", 900, 370, 360, "✕ kill -9 ở đây", 30),
        logbox("pb-log", 110, 470, 1700, "Đã chạy · mỗi bước một JVM riêng", PB_LOG, "muted", 30),
        note("pb-trap", 110, 860, 1700, "Kafka transaction không chung transaction với PostgreSQL", "red", 32, "center"),
        take("pb", "Hai lần ghi, không có transaction chung", "mỗi bước commit riêng · lỗi giữa chừng để lại trạng thái nửa vời"),
    ]), beats=[
        B(pb1, "@Transactional: chỉ đúng trong một connection tới một database.",
          lambda w: [IN("#pb-eye", "blur"), TYPE("#pb-q", 0.2, 0.05), IN("#pb-rule", "up", w("Nhưng lời hứa"))]),
        B(pb2, "Ba database: Order commit xong, Payment lỗi, không ROLLBACK nào kéo về được.",
          lambda w: [OUT("#pb-rule", "blur", 0, 0.4), *shrink("pb", 0), IN("#pb-c", "down", 0.6),
                     *[IN(f"#pb-d{i}", "up", w("mỗi service một") + 0.25 * i) for i in range(4)],
                     *AW("pb-a0", w("Order commit"), 0.5), *AW("pb-a1", w("mà Payment"), 0.4), *AW("pb-a2", w("mà Payment") + 0.2, 0.4),
                     PULSE("#pb-d2", w("mà Payment") + 0.6), *AW("pb-a3", w("Kafka cũng"), 0.4), IN("#pb-n", "up", w("không chung"))]),
        B(pb3, "Dual write: event ma, hoặc mất event.",
          lambda w: [OUT(S("pb-c", "pb-d0", "pb-d1", "pb-d2", "pb-d3", "pb-n") + ", " + AR("pb-a0", "pb-a1", "pb-a2", "pb-a3"), "blur", 0, 0.5),
                     IN("#pb-k0", "up", w("Gửi trong")), IN("#pb-k1", "up", w("Commit rồi")), SHAKE("#pb-k1", w("crash ở giữa"))]),
        B(pb4, "Đã chạy: DB có 1 alice PENDING, topic order-events 0 record.",
          lambda w: [OUT(S("pb-k0", "pb-k1"), "blur", 0, 0.4),
                     IN("#pb-s0", "up", w("Commit đơn")), *AW("pb-f0", w("Commit đơn") + 0.2, 0.3), IN("#pb-s1", "up", w("Commit đơn") + 0.4),
                     *AW("pb-f1", w("ngay trước"), 0.3), IN("#pb-s2", "up", w("ngay trước") + 0.2), IN("#pb-x", "pop", w("kill trừ")),
                     IN("#pb-log", "fade", w("kill trừ") + 0.3, 0.4), IN("#pb-log-1", "type1", w("kill trừ") + 0.5), IN("#pb-log-2", "type1", w("kill trừ") + 0.9),
                     IN("#pb-log-3", "type1", w("ngay trước lệnh")), IN("#pb-log-4", "type1", w("Database có")),
                     IN("#pb-log-5", "type1", w("Còn topic")), PULSE("#pb-log-5", w("không có record"))]),
        B(pb5, "Bẫy: Kafka transaction không chung với PostgreSQL.",
          lambda w: [IN("#pb-trap", "up", 0.3),
                     DIM(S("pb-eye", "pb-q", "pb-s0", "pb-s1", "pb-s2", "pb-x", "pb-log", "pb-trap") + ", " + AR("pb-f0", "pb-f1"), w("Nhớ chuỗi"), 0.07),
                     *show_take("pb", w("Nhớ chuỗi") + 0.3, w("lỗi giữa chừng"))]),
    ]),
    # ------------------------------------------------------------ two-phase-commit
    dict(id="two-phase-commit", world=(1920, 1080), hud="", cam="".join([
        head("tp", "Phần 2 · 2PC và XA", "Two-phase commit"),
        rule("tp-rule", "Một coordinator, nhiều participant", "Chuẩn XA · trong Java là JTA · cần Atomikos hoặc Narayana"),
        titled("tp-co", 480, 240, 420, 120, "", "Coordinator", "", "amber", 40),
        titled("tp-dead", 480, 240, 420, 120, "", "✕ Coordinator chết", "", "red", 36),
        titled("tp-p0", 180, 600, 380, 130, "", "Order DB", "", "cyan", 38),
        titled("tp-p1", 820, 600, 380, 130, "", "Payment DB", "", "cyan", 38),
        wires(arrow("tp-a0", [(620, 365), (390, 595)], "amber"), arrow("tp-a1", [(760, 365), (990, 595)], "amber")),
        tag("tp-v0", 180, 760, 380, 90, "YES · giữ lock", "amber", 28),
        tag("tp-v1", 820, 760, 380, 90, "YES · giữ lock", "amber", 28),
        tag("tp-c0", 180, 760, 380, 90, "COMMIT · nhả lock", "green", 28),
        tag("tp-c1", 820, 760, 380, 90, "COMMIT · nhả lock", "green", 28),
        tag("tp-i0", 180, 760, 380, 90, "in-doubt · giữ lock", "red", 28),
        tag("tp-i1", 820, 760, 380, 90, "in-doubt · giữ lock", "red", 28),
        card("tp-ph1", 1290, 240, 520, 290, "Pha 1 · prepare", "ghi đủ xuống đĩa, giữ lock, bỏ phiếu YES hoặc NO", "amber", 36, 28),
        card("tp-ph2", 1290, 560, 520, 290, "Pha 2 · commit", "mọi bên YES: COMMIT. Một NO hoặc timeout: ROLLBACK", "green", 36, 28),
        card("tp-ph3", 1290, 240, 520, 610, "In-doubt", "không được tự commit, không được tự rollback. Giao dịch khác chạm các dòng đó đứng chờ", "red", 40, 30),
        *[card(f"tp-w{i}", 110 + i * 433, 260, 400, 380, t, d, "red", 36, 28) for i, (t, d) in enumerate([
            ("Blocking", "coordinator chết: participant in-doubt giữ lock"),
            ("Nút cổ chai", "mọi giao dịch qua coordinator, thêm vòng mạng"),
            ("Không có XA", "Kafka, phần lớn NoSQL, API thanh toán"),
            ("Gắn chặt", "chung một transaction manager, cùng online")])],
        note("tp-ok", 110, 690, 1700, "Vẫn có chỗ: hệ thống nguyên khối chạm hai database · bên trong database phân tán", "green", 32, "center"),
        take("tp", "Nói \"chậm\" là chưa đủ", "in-doubt giữ lock · Kafka không tham gia XA · buộc chung transaction manager"),
    ]), beats=[
        B(tp1, "2PC: chuẩn XA, trong Java là JTA (Atomikos, Narayana).",
          lambda w: [IN("#tp-eye", "blur"), TYPE("#tp-q", 0.2, 0.05), IN("#tp-rule", "up", w("Chuẩn cho"))]),
        B(tp2, "Pha 1, prepare: ghi xuống đĩa, giữ lock, bỏ phiếu.",
          lambda w: [OUT("#tp-rule", "blur", 0, 0.4), *shrink("tp", 0), IN("#tp-co", "down", 0.6),
                     IN("#tp-p0", "up", w("hỏi từng")), IN("#tp-p1", "up", w("hỏi từng") + 0.3),
                     *AW("tp-a0", w("hỏi từng") + 0.3, 0.5), *AW("tp-a1", w("hỏi từng") + 0.5, 0.5),
                     IN("#tp-ph1", "left", w("Participant ghi")), IN("#tp-v0", "pop", w("bỏ phiếu")), IN("#tp-v1", "pop", w("bỏ phiếu") + 0.3)]),
        B(tp3, "Pha 2: mọi bên YES thì COMMIT, một NO hoặc timeout thì ROLLBACK.",
          lambda w: [PULSE("#tp-co", w("ghi quyết định")), IN("#tp-ph2", "left", w("Pha hai")),
                     OUT(S("tp-v0", "tp-v1"), "fade", w("bảo mọi bên"), 0.3), IN("#tp-c0", "pop", w("bảo mọi bên") + 0.2), IN("#tp-c1", "pop", w("bảo mọi bên") + 0.4)]),
        B(tp4, "Coordinator chết sau pha 1: participant in-doubt, giữ lock.",
          lambda w: [OUT(S("tp-c0", "tp-c1", "tp-ph1", "tp-ph2"), "fade", 0, 0.3), IN("#tp-v0", "fade", 0.2, 0.3), IN("#tp-v1", "fade", 0.2, 0.3),
                     OUT("#tp-co", "fade", w("Coordinator chết"), 0.2), IN("#tp-dead", "pop", w("Coordinator chết")), SHAKE("#tp-dead", w("Coordinator chết") + 0.5),
                     OUT(S("tp-v0", "tp-v1"), "fade", w("in doubt") - 0.2, 0.3),
                     IN("#tp-i0", "pop", w("in doubt")), IN("#tp-i1", "pop", w("in doubt") + 0.2), IN("#tp-ph3", "left", w("Không được tự commit"))]),
        B(tp5, "Vì sao microservices né 2PC.",
          lambda w: [OUT(S("tp-co", "tp-dead", "tp-p0", "tp-p1", "tp-i0", "tp-i1", "tp-ph3") + ", " + AR("tp-a0", "tp-a1"), "blur", 0, 0.5),
                     IN("#tp-w0", "up", w("Blocking")), IN("#tp-w1", "up", w("nút cổ chai")), IN("#tp-w2", "up", w("Kafka, phần lớn")),
                     IN("#tp-w3", "up", w("Và mọi service"))]),
        B(tp6, "Đừng chỉ nói \"chậm\": nói in-doubt giữ lock, Kafka không tham gia XA.",
          lambda w: [IN("#tp-ok", "up", 0.3),
                     DIM(S("tp-eye", "tp-q", "tp-w0", "tp-w1", "tp-w2", "tp-w3", "tp-ok"), w("Khi phỏng vấn"), 0.07),
                     *show_take("tp", w("Khi phỏng vấn") + 0.3, w("Hãy nói"))]),
    ]),
    # ------------------------------------------------------------ saga
    dict(id="saga", world=(1920, 1080), hud="", cam="".join([
        head("sg", "Phần 3 · Saga", "Chuỗi local transaction có bước bù"),
        rule("sg-rule", "Mỗi bước commit ngay, sai thì bù ngược", "Bù là nghiệp vụ mới: hoàn tiền, đơn CANCELLED. Không phải rollback"),
        *[titled(f"sg-s{i}", SG_X[i], 240, 300, 150, top, main, sub, tone, 34) for i, (top, main, sub, tone) in enumerate(SG_STEP)],
        wires(*[arrow(f"sg-a{i}", [(SG_X[i] + 305, 315), (SG_X[i + 1] - 5, 315)], "muted") for i in range(4)],
              arrow("sg-r0", [(900, 585), (630, 520)], "red", True), arrow("sg-r1", [(455, 475), (415, 475)], "red", True)),
        tag("sg-b0", SG_X[0], 430, 300, 90, "bù: CANCELLED", "muted", 26),
        tag("sg-b1", SG_X[1], 430, 300, 90, "bù: nhả hàng", "muted", 26),
        tag("sg-b3", SG_X[3], 430, 300, 90, "chỉ retry", "green", 26),
        tag("sg-b4", SG_X[4], 430, 300, 90, "chỉ retry", "green", 26),
        bigerr("sg-x", 905, 560, 400, "✕ thẻ bị từ chối", 30),
        note("sg-xn", 110, 680, 1700, "Nhả hàng (bù B2) → đơn CANCELLED, lý do PAYMENT_DECLINED (bù B1)", "red", 32, "center"),
        card("sg-k0", 110, 580, 540, 250, "Compensatable", "trước pivot, bù được: tạo đơn, giữ hàng", "cyan", 36, 28),
        card("sg-k1", 690, 580, 540, 250, "Pivot", "thành công thì đi tới cùng", "amber", 36, 28),
        card("sg-k2", 1270, 580, 540, 250, "Retriable", "sau pivot, chỉ retry: duyệt đơn, email", "green", 36, 28),
        tag("sg-m0", 110, 580, 540, 110, "retry tới khi xong", "violet", 30),
        tag("sg-m1", 690, 580, 540, 110, "idempotent", "violet", 30),
        tag("sg-m2", 1270, 580, 540, 110, "chịu được bước gốc chưa xảy ra", "violet", 28),
        note("sg-mn", 110, 740, 1700, "Lỗi mãi: COMPENSATION_FAILED + alert cho người xử lý", "red", 32, "center"),
        pbox("sg-ch", 110, 230, 830, "Choreography · nghe event", CHOREO, "cyan", 26),
        pbox("sg-or", 980, 230, 830, "Orchestration · bảng saga_instance", ORCH, "violet", 26),
        note("sg-chn", 110, 600, 830, "Ít bước: ít code, không trung tâm.\nNhiều bước: luồng rải rác, khó debug.", "muted", 30),
        note("sg-orn", 980, 600, 830, "Luồng ở một chỗ: đơn kẹt ở đâu,\nđọc saga_instance là biết.", "green", 30),
        note("sg-ob", 110, 760, 1700, "Commit rồi gửi message = dual write → saga luôn đi cùng outbox", "red", 32, "center"),
        take("sg", "Bù, không phải rollback", "ít bước: choreography · nhiều bước: orchestration · luôn kèm outbox"),
    ]), beats=[
        B(sg1, "Saga: chuỗi local transaction, sai thì bù ngược. Bù không phải rollback.",
          lambda w: [IN("#sg-eye", "blur"), TYPE("#sg-q", 0.2, 0.05), IN("#sg-rule", "up", w("Bước sau lỗi")), PULSE("#sg-rule", w("Bước bù không"))]),
        B(sg2, "Đặt hàng: PENDING, giữ hàng, thu tiền, APPROVED, vận đơn và email.",
          lambda w: [OUT("#sg-rule", "blur", 0, 0.4), *shrink("sg", 0),
                     IN("#sg-s0", "up", w("tạo đơn")), *AW("sg-a0", w("giữ hàng"), 0.3), IN("#sg-s1", "up", w("giữ hàng")),
                     *AW("sg-a1", w("thu tiền"), 0.3), IN("#sg-s2", "up", w("thu tiền")),
                     *AW("sg-a2", w("duyệt đơn"), 0.3), IN("#sg-s3", "up", w("duyệt đơn")),
                     *AW("sg-a3", w("rồi tạo vận"), 0.3), IN("#sg-s4", "up", w("rồi tạo vận")),
                     IN("#sg-b0", "up", w("Tạo đơn bù")), IN("#sg-b1", "up", w("giữ hàng bù")),
                     IN("#sg-b3", "up", w("Hai bước cuối")), IN("#sg-b4", "up", w("Hai bước cuối") + 0.2)]),
        B(sg3, "Thẻ bị từ chối: nhả hàng, rồi huỷ đơn với lý do PAYMENT_DECLINED.",
          lambda w: [IN("#sg-x", "pop", 0.2), SHAKE("#sg-s2", 0.5), *AW("sg-r0", w("nhả hàng"), 0.5), PULSE("#sg-b1", w("nhả hàng") + 0.5),
                     *AW("sg-r1", w("rồi chuyển"), 0.3), PULSE("#sg-b0", w("rồi chuyển") + 0.4), IN("#sg-xn", "up", w("với lý do"))]),
        B(sg4, "Pivot: điểm không quay lại. Bước không bù được đặt sau pivot.",
          lambda w: [OUT(S("sg-x", "sg-xn") + ", " + AR("sg-r0", "sg-r1"), "blur", 0, 0.4), PULSE("#sg-s2", 0.3),
                     IN("#sg-k1", "up", 0.5), IN("#sg-k0", "up", w("Trước pivot")), IN("#sg-k2", "up", w("sau đó chỉ")),
                     PULSE("#sg-s4", w("Email đã gửi"))]),
        B(sg5, "Bước bù: retry tới khi xong, idempotent, chịu được bước gốc chưa xảy ra.",
          lambda w: [OUT(S("sg-k0", "sg-k1", "sg-k2"), "blur", 0, 0.4),
                     IN("#sg-m0", "up", w("phải retry")), IN("#sg-m1", "up", w("phải idempotent")), IN("#sg-m2", "up", w("và chịu được")),
                     IN("#sg-mn", "up", w("Lỗi mãi"))]),
        B(sg6, "Choreography: nghe event. Orchestration: state machine, saga_instance.",
          lambda w: [OUT(S("sg-m0", "sg-m1", "sg-m2", "sg-mn", *[f"sg-s{i}" for i in range(5)], "sg-b0", "sg-b1", "sg-b3", "sg-b4")
                         + ", " + AR(*[f"sg-a{i}" for i in range(4)]), "blur", 0, 0.5),
                     IN("#sg-ch", "up", w("Choreography")), IN("#sg-chn", "up", w("ít code")),
                     IN("#sg-or", "up", w("Orchestration")), IN("#sg-orn", "up", w("đơn kẹt"))]),
        B(sg7, "Mỗi bước commit rồi gửi message là dual write: saga luôn đi cùng outbox.",
          lambda w: [IN("#sg-ob", "up", 0.3),
                     DIM(S("sg-eye", "sg-q", "sg-ch", "sg-or", "sg-chn", "sg-orn", "sg-ob"), w("Vì vậy"), 0.07),
                     *show_take("sg", w("Vì vậy") + 0.3, w("luôn đi cùng"))]),
    ]),
    # ------------------------------------------------------------ outbox
    dict(id="outbox", world=(1920, 1080), hud="", cam="".join([
        head("ob", "Phần 4 · Transactional outbox", "Không bao giờ mất event"),
        rule("ob-rule", "Event ghi vào bảng outbox, cùng transaction với đơn", "Relay đọc bảng outbox rồi publish lên Kafka"),
        titled("ob-n1", 110, 240, 620, 130, "một transaction", "INSERT đơn + outbox", "", "green", 34),
        titled("ob-n2", 850, 240, 300, 130, "polling / CDC", "Relay", "", "violet", 36),
        titled("ob-n3", 1270, 240, 540, 130, "topic", "order-events", "", "cyan", 36),
        wires(arrow("ob-a1", [(735, 305), (845, 305)], "muted"), arrow("ob-a2", [(1155, 305), (1265, 305)], "muted")),
        logbox("ob-log", 110, 420, 1700, "Đã chạy · kill -9 tại điểm đánh dấu", OB_LOG, "muted", 28),
        note("ob-n", 110, 830, 1700, "2 record · cùng message_id · cùng partition 2 (key = aggregate_id)", "red", 32, "center"),
        cbox("ob-code", 110, 230, 960, "InventoryConsumer.java", INBOX, "violet", 24),
        logbox("ob-res", 1110, 230, 700, "Kết quả thật", OB_RES, "green", 26),
        tag("ob-i0", 110, 700, 540, 110, "id từ outbox, không dùng offset", "cyan", 26),
        tag("ob-i1", 690, 700, 540, 110, "PK (message_id, consumer)", "cyan", 26),
        tag("ob-i2", 1270, 700, 540, 110, "cùng transaction với nghiệp vụ", "cyan", 26),
        take("ob", "Outbox gửi, inbox nhận", "thiếu một trong hai: mất event, hoặc xử lý trùng"),
    ]), beats=[
        B(ob1, "Outbox: ghi event vào bảng outbox cùng transaction với đơn.",
          lambda w: [IN("#ob-eye", "blur"), TYPE("#ob-q", 0.2, 0.05), IN("#ob-rule", "up", w("thay vì")),
                     OUT("#ob-rule", "blur", w("Một tiến trình") - 0.4, 0.4), *shrink("ob", w("Một tiến trình") - 0.4),
                     IN("#ob-n1", "up", w("Một tiến trình")), *AW("ob-a1", w("relay"), 0.3), IN("#ob-n2", "up", w("relay") + 0.2),
                     *AW("ob-a2", w("publish"), 0.3), IN("#ob-n3", "up", w("publish") + 0.2)]),
        B(ob2, "Crash sau commit: dòng outbox vẫn còn, published_at = NULL.",
          lambda w: [IN("#ob-log", "fade", 0.2, 0.4), IN("#ob-log-1", "type1", w("tạo đơn")), IN("#ob-log-2", "type1", w("Bảng outbox")),
                     PULSE("#ob-log-2", w("Việc phải"))]),
        B(ob3, "Relay chết sau send, trước khi đánh dấu: relay mới gửi lại.",
          lambda w: [IN("#ob-log-3", "type1", w("relay gửi")), IN("#ob-log-4", "type1", w("bị kill")),
                     IN("#ob-log-5", "type1", w("gửi lại")), IN("#ob-log-6", "type1", w("rồi mới đánh"))]),
        B(ob4, "2 record cùng message_id: at-least-once, không phải exactly-once.",
          lambda w: [PULSE("#ob-log-3", 0.3), PULSE("#ob-log-5", 0.6), IN("#ob-n", "up", w("cùng partition")),
                     PULSE("#ob-n3", w("Outbox đảm bảo"))]),
        B(ob5, "Inbox: INSERT message_id ON CONFLICT DO NOTHING, cùng transaction.",
          lambda w: [OUT(S("ob-n1", "ob-n2", "ob-n3", "ob-log", "ob-n") + ", " + AR("ob-a1", "ob-a2"), "blur", 0, 0.5),
                     IN("#ob-code", "up", w("bằng bảng inbox")), IN("#ob-i1", "up", w("Insert message")),
                     IN("#ob-i2", "up", w("cùng transaction")), PULSE("#ob-code", w("Insert được"))]),
        B(ob6, "Đã chạy: offset 0 giữ hàng, offset 1 bị bỏ qua, 1 reservation.",
          lambda w: [IN("#ob-res", "fade", 0.2, 0.4), IN("#ob-res-1", "type1", w("offset không")), IN("#ob-res-2", "type1", w("giữ hàng cho")),
                     IN("#ob-res-3", "type1", w("Offset một")), IN("#ob-res-4", "type1", w("bị bỏ qua")),
                     IN("#ob-res-5", "type1", w("Cuối cùng")), IN("#ob-res-6", "type1", w("Cuối cùng") + 0.4),
                     IN("#ob-i0", "up", w("Chống trùng")),
                     OUT(S("ob-eye", "ob-q", "ob-code", "ob-res", "ob-i0", "ob-i1", "ob-i2"), "blur", w("Chống trùng") + 0.8, 0.5),
                     *show_take("ob", w("Chống trùng") + 1.0, w("Chống trùng") + 1.9)]),
    ]),
    # ------------------------------------------------------------ saga-isolation
    dict(id="saga-isolation", world=(1920, 1080), hud="", cam="".join([
        head("si", "Phần 5 · Isolation, saga treo, TCC", "Saga không có chữ I"),
        rule("si-rule", "Saga có A, C, D nhưng không có I", "Mỗi bước commit ngay: service khác thấy trạng thái dở dang"),
        tag("si-d0", 110, 240, 520, 130, "A giữ 5 sản phẩm cuối", "cyan", 30),
        tag("si-d1", 700, 240, 520, 130, "B thấy hết hàng, từ chối", "amber", 30),
        tag("si-d2", 1290, 240, 520, 130, "A bị bù, hàng về kho", "red", 30),
        wires(arrow("si-a0", [(635, 305), (695, 305)], "muted"), arrow("si-a1", [(1225, 305), (1285, 305)], "muted")),
        note("si-dn", 110, 400, 1700, "B từ chối dựa trên dữ liệu không bao giờ thành sự thật: dirty read", "red", 32, "center"),
        *[card(f"si-c{i}", 110 + (i % 2) * 870, 490 + (i // 2) * 200, 830, 180, t, d, "green", 34, 27) for i, (t, d) in enumerate([
            ("Semantic lock", "cờ PENDING: dữ liệu chưa chắc chắn"),
            ("Commutative updates", "stock - 2 rồi stock + 2, không ghi stock = 8"),
            ("Pessimistic view", "sắp lại bước để giảm hậu quả"),
            ("Reread value", "đọc lại kèm version, đổi thì huỷ hoặc làm lại")])],
        tag("si-h0", 110, 240, 760, 110, "Saga treo ở CHARGING", "red", 32),
        *[tag(f"si-h{i + 1}", 110, 380 + i * 130, 760, 100, t, "amber", 28) for i, t in enumerate([
            "deadline trong saga_instance", "job quét · hỏi lại trạng thái", "TTL riêng cho reservation"])],
        *[titled(f"si-k{i}", 980, 240 + i * 150, 830, 130, "", m, s, tone, 34) for i, (m, s, tone) in enumerate([
            ("Try", "giữ chỗ: đóng băng 500.000đ", "amber"), ("Confirm", "dùng phần đã giữ: chuyển thật", "green"),
            ("Cancel", "nhả phần đã giữ", "violet")])],
        note("si-tn", 980, 700, 830, "Empty cancel: Try chưa tới, Cancel trả OK.\nSuspension: Try tới sau Cancel thì từ chối.", "red", 30),
        take("si", "Chặn bằng nghiệp vụ", "SERIALIZABLE không cứu được · PENDING · cộng trừ · version · deadline"),
    ]), beats=[
        B(si1, "Saga có A, C, D nhưng không có I: service khác thấy trạng thái dở dang.",
          lambda w: [IN("#si-eye", "blur"), TYPE("#si-q", 0.2, 0.05), IN("#si-rule", "up", w("nhưng không có"))]),
        B(si2, "Dirty read ở mức saga.",
          lambda w: [OUT("#si-rule", "blur", 0, 0.4), *shrink("si", 0),
                     IN("#si-d0", "up", w("saga A")), *AW("si-a0", w("Saga B"), 0.3), IN("#si-d1", "up", w("Saga B")),
                     *AW("si-a1", w("Sau đó"), 0.3), IN("#si-d2", "up", w("Sau đó")), IN("#si-dn", "up", w("B đã từ chối"))]),
        B(si3, "Semantic lock · commutative updates · pessimistic view · reread value.",
          lambda w: [IN("#si-c0", "up", w("Semantic lock")), IN("#si-c1", "up", w("Commutative")),
                     IN("#si-c2", "up", w("Pessimistic")), IN("#si-c3", "up", w("Reread"))]),
        B(si4, "Saga treo: deadline, job quét, hỏi lại trạng thái, TTL cho reservation.",
          lambda w: [OUT(S("si-d0", "si-d1", "si-d2", "si-dn", "si-c0", "si-c1", "si-c2", "si-c3") + ", " + AR("si-a0", "si-a1"), "blur", 0, 0.5),
                     IN("#si-h0", "up", w("kẹt ở")), IN("#si-h1", "up", w("deadline")), IN("#si-h2", "up", w("một job")),
                     IN("#si-h3", "up", w("Reservation"))]),
        B(si5, "TCC: Try giữ chỗ, Confirm dùng thật, Cancel nhả.",
          lambda w: [IN("#si-k0", "left", w("Try chỉ")), IN("#si-k1", "left", w("Confirm")), IN("#si-k2", "left", w("Cancel thì"))]),
        B(si6, "Bẫy TCC: empty cancel và suspension. SERIALIZABLE không cứu được saga.",
          lambda w: [IN("#si-tn", "up", w("Empty cancel")),
                     DIM(S("si-eye", "si-q", "si-h0", "si-h1", "si-h2", "si-h3", "si-k0", "si-k1", "si-k2", "si-tn"), w("Và nhớ"), 0.07),
                     *show_take("si", w("Và nhớ") + 0.3, w("Serializable"))]),
    ]),
    # ------------------------------------------------------------ choose-answer
    dict(id="choose-answer", world=(1920, 1080), hud="", cam="".join([
        head("ca", "Phần 6 · Chọn giải pháp", "Trả lời theo thứ tự"),
        *[box(f"ca-r{i}", 130, 220 + i * 105, 1660, 90, row(k, t, 400), "cyan", "row") for i, (k, t) in enumerate(CA_ROWS)],
        *[box(f"ca-d{i}", 110, 230 + i * 125, 1160, 105, f'<span style="font-size:30px;text-align:left;width:100%">{esc(q)}</span>', "cyan")
          for i, (q, _a) in enumerate(CA_DRILL)],
        *[tag(f"ca-a{i}", 1310, 230 + i * 125, 500, 105, a, "green", 32) for i, (_q, a) in enumerate(CA_DRILL)],
        take("ca", "Framework là chi tiết sau cùng", "nói vì sao cần saga, bước nào là pivot, event trùng xử lý thế nào"),
    ]), beats=[
        B(ca1, "Đầu tiên: có thật cần phân tán không?",
          lambda w: [IN("#ca-eye", "blur"), TYPE("#ca-q", 0.2, 0.05), *shrink("ca", w("Trả lời theo") + 0.5),
                     IN("#ca-r0", "right", w("Đầu tiên"))]),
        B(ca2, "Nhất quán sau cùng · saga · outbox · idempotent · isolation.",
          lambda w: [IN("#ca-r1", "right", w("chấp nhận")), IN("#ca-r2", "right", w("Saga cho")), IN("#ca-r3", "right", w("Outbox cho")),
                     IN("#ca-r4", "right", w("Consumer idempotent")), IN("#ca-r5", "right", w("Cuối cùng"))]),
        B(ca3, "Chọn nhanh: tình huống nào, giải pháp nào? (1 - 3)",
          lambda w: [OUT(S(*[f"ca-r{i}" for i in range(6)]), "blur", 0, 0.5),
                     IN("#ca-d0", "right", w("Lưu đơn")), IN("#ca-a0", "pop", w("chỉ cần outbox")),
                     IN("#ca-d1", "right", w("Đặt hàng qua")), IN("#ca-a1", "pop", w("saga cộng")),
                     IN("#ca-d2", "right", w("Hệ thống nguyên")), IN("#ca-a2", "pop", w("two phase"))]),
        B(ca4, "Chọn nhanh (4 - 5).",
          lambda w: [IN("#ca-d3", "right", 0.1), IN("#ca-a3", "pop", w("Transactional thường")),
                     IN("#ca-d4", "right", w("Chuyển tiền")), IN("#ca-a4", "pop", w("TCC"))]),
        B(ca5, "Bẫy: nhảy thẳng vào framework.",
          lambda w: [DIM(S("ca-eye", "ca-q", *[f"ca-d{i}" for i in range(5)], *[f"ca-a{i}" for i in range(5)]), 0, 0.07),
                     *show_take("ca", w("Framework") - 0.3, w("mà không nói"))]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 60, 1920, None, letters("Tóm tắt"), "h1 r", "font-size:96px"),
        *[box(f"ou-r{i}", 130, 220 + i * 118, 1660, 100, row(k, t, 420), "cyan", "row") for i, (k, t) in enumerate(OU_ROWS)],
        el("ou-cta", 0, 860, 1920, None, "Mở bài học tương tác để làm quiz và xem lại log chạy thật", "cta r"),
    ]), beats=[
        B(ou1, "Dual write và 2PC.",
          lambda w: [TYPE("#ou-h", 0, 0.04), IN("#ou-r0", "right", w("Dual write")), IN("#ou-r1", "right", w("Two phase"))]),
        B(ou2, "Saga, outbox cùng inbox, isolation.",
          lambda w: [IN("#ou-r2", "right", w("Saga:")), IN("#ou-r3", "right", w("Outbox cùng")), IN("#ou-r4", "right", w("Saga thiếu"))]),
        B(ou3, "Mở bài học tương tác để làm quiz.",
          lambda w: [IN("#ou-cta", "blur", 0.2)]),
    ]),
]

fit_to_audio(SCENES, __file__)
