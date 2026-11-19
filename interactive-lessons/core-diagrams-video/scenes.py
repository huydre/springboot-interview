"""Core mechanism diagrams review: redraw the key diagrams step by step (draw, pause to predict the next arrow, reveal).

Source: docs/study-notes/06 - Sơ đồ cơ chế cốt lõi.md (12 diagrams) and web/src/data/lessons/core-diagrams.ts. No new measurements:
@Transactional via CGLIB proxy + TransactionInterceptor, connection and EntityManager bound to ThreadLocal, checked exception commits;
self-invocation skips the proxy; REQUIRED inner failure marks rollback-only -> UnexpectedRollbackException, REQUIRES_NEW uses a second connection;
entity states + merge() returns a new managed copy; N+1 = 1 + N, JOIN FETCH / EntityGraph = 1, default_batch_fetch_size 50 = 1 + N/50,
JOIN FETCH collection + Pageable paginates in memory; HashMap.put: 16, 0.75, 8, 64, 6; ThreadPoolExecutor core -> queue -> max -> reject;
MVC flow, bean lifecycle (AOP proxy in postProcessAfterInitialization), auto-configuration conditions, Security + JWT 401/403,
cache-aside with TTL + jitter and the three incidents (penetration, stampede -> lock/single-flight, avalanche -> jitter).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

RATE = 14.5


def _flat(x):
    if isinstance(x, dict):
        return [x]
    return [y for i in x for y in _flat(i)]


def beat(spoken, caption, *acts):
    """Place actions at the spoken position of a phrase (None = start of the beat), plus an optional extra offset."""
    out = []
    for act in acts:
        phrase, actions, off = (act + (0,))[:3] if len(act) == 2 else act
        base = 0 if phrase is None else spoken.index(phrase) / RATE
        for a in _flat(actions):
            a = dict(a)
            a["d"] = round(a.get("d", 0) + base + off, 2)
            out.append(a)
    return (spoken, caption, out)


class D:
    """One diagram: nodes (glossy), arrows between them, chips and notes, all addressable by short keys."""

    def __init__(self, p):
        self.p, self.g, self.items, self.arrows, self.ids = p, {}, [], [], []

    def n(self, k, x, y, w, label, tone="cyan", h=76):
        i = f"{self.p}{k}"
        self.g[k] = (x, y, w, h)
        self.items.append(gnode(i, x, y, w, h, esc(label), tone))
        self.ids.append(f"#{i}")
        return f"#{i}"

    def a(self, k, frm, to, mode="r", tone="cyan", pts=None):
        i = f"{self.p}{k}"
        x, y, w, h = self.g[frm]
        X, Y, W, H = self.g[to]
        if pts is None:
            if mode == "r":
                pts = [(x + w + 6, y + h / 2), (X - 8, Y + H / 2)]
            elif mode == "l":
                pts = [(x - 6, y + h / 2), (X + W + 8, Y + H / 2)]
            elif mode == "d":
                pts = [(x + w / 2, y + h + 6), (x + w / 2, Y - 8)]
            else:
                raise ValueError(mode)
        self.arrows.append(arrow(i, pts, tone))
        self.ids.append(f"#{i}")
        return i

    def c(self, k, x, y, text, tone="cyan"):
        i = f"{self.p}{k}"
        self.items.append(chip(i, x, y, text, tone))
        self.ids.append(f"#{i}")
        return f"#{i}"

    def t(self, k, x, y, w, text, cls="note left"):
        i = f"{self.p}{k}"
        self.items.append(el(i, x, y, w, None, esc(text), f"{cls} r"))
        self.ids.append(f"#{i}")
        return f"#{i}"

    def q(self, k="q"):
        """Prediction prompt in the top-right corner."""
        i = f"{self.p}{k}"
        self.items.append(chip(i, 1330, 84, "Đoán mũi tên kế tiếp", "amber"))
        return f"#{i}"

    def html(self):
        return "".join(self.items)

    def out(self, d=0.0):
        return OUT(", ".join(self.ids), "fade", d, 0.45)


def AR(i, d=0.0):
    return [DRAW(f"#{i}-p", d, 0.45), IN(f"#{i}-h", "pop", d + 0.4, 0.2)]


def ND(sel, d=0.0, lit=False):
    acts = [IN(sel, "pop", d, 0.4)]
    if lit:
        acts.append(LIGHT(sel, d + 0.3))
    return acts


def STEP(i, sel, d=0.0, lit=False):
    return AR(i, d) + ND(sel, d + 0.45, lit)


def scene(sid, hud_id, title, sub, diagrams, beats):
    arrows = [a for d in diagrams for a in d.arrows]
    cam = hud(hud_id, title, sub) + "".join(d.html() for d in diagrams) + wires(*arrows)
    return dict(id=sid, world=(1920, 1080), hud="", cam=cam, beats=beats)


# ================================================================== transaction
d1 = D("t1")
c1 = d1.n("c", 80, 250, 320, "Controller", "amber")
p1 = d1.n("p", 440, 250, 320, "Proxy CGLIB", "violet")
i1 = d1.n("i", 800, 250, 320, "Interceptor", "violet")
m1 = d1.n("m", 1160, 250, 320, "TxManager", "cyan")
s1 = d1.n("s", 1520, 250, 320, "Target thật", "cyan")
tl1 = d1.n("tl", 1160, 420, 320, "ThreadLocal", "green")
d1.a("a1", "c", "p"); d1.a("a2", "p", "i"); d1.a("a3", "i", "m"); d1.a("a4", "m", "s"); d1.a("a5", "m", "tl", "d")
d1.t("tn", 600, 440, 520, "bind connection + EntityManager", "note")
k1 = d1.c("k1", 80, 600, "thành công: commit", "green")
k2 = d1.c("k2", 80, 690, "RuntimeException, Error: rollback", "red")
k3 = d1.c("k3", 80, 780, "Checked exception: vẫn commit", "amber")
q1 = d1.q("q")

d2 = D("t2")
d2.t("la", 80, 190, 800, "Gọi bằng this", "lbl")
d2.t("lb", 80, 440, 800, "Gọi qua bean khác", "lbl")
d2.n("c", 80, 250, 320, "Controller", "amber")
d2.n("p", 440, 250, 320, "Proxy", "violet")
d2.n("o", 800, 250, 320, "createOrders", "cyan")
d2.n("x", 1160, 250, 320, "this.createOne", "red")
d2.n("o2", 800, 500, 320, "createOrders", "cyan")
d2.n("w", 1160, 500, 320, "Proxy Writer", "violet")
d2.n("e", 1520, 500, 320, "createOne", "green")
d2.a("a1", "c", "p"); d2.a("a2", "p", "o"); d2.a("a3", "o", "x", tone="red"); d2.a("b1", "o2", "w"); d2.a("b2", "w", "e")
d2.c("kx", 1160, 350, "@Transactional bị bỏ qua", "red")
d2.c("ke", 1160, 600, "mở transaction", "green")
q2 = d2.q("q")

d3 = D("t3")
d3.n("o", 90, 250, 300, "outer()", "amber")
d3.n("i", 470, 250, 300, "inner()", "cyan")
d3.n("r", 850, 250, 330, "rollback-only", "red")
d3.n("au", 90, 500, 300, "auditLog()", "violet")
d3.n("t2", 470, 500, 360, "Tx2 commit riêng", "green")
d3.n("oc", 900, 500, 300, "outer commit", "amber")
d3.n("u", 1260, 500, 600, "UnexpectedRollbackException", "red")
d3.a("a1", "o", "i"); d3.a("a2", "i", "r", tone="red")
d3.a("b1", "au", "t2"); d3.a("b2", "t2", "oc"); d3.a("b3", "oc", "u", tone="red")
d3.c("k1", 1230, 272, "Tx1: connection #1", "cyan")
d3.c("k2", 90, 640, "REQUIRES_NEW: connection #2, mỗi request chiếm 2 connection", "amber")
q3 = d3.q("q")

tx = scene("transaction", "t0", "Transaction", "Sơ đồ 1 đến 3", [d1, d2, d3], [
    beat("Phần một: transaction. Sơ đồ một: Controller gọi vào đâu đầu tiên? Hãy đoán.",
         "Sơ đồ 1: Controller gọi vào đâu đầu tiên? Đoán mũi tên kế tiếp.",
         (None, [IN("#t0-hud", "left", 0.1)]), ("Sơ đồ một", ND(c1)), ("Controller gọi vào đâu", IN(q1, "pop", 0, 0.4))),
    beat("Không phải service thật. Controller gọi proxy CGLIB, rồi Interceptor, rồi transaction manager.",
         "Controller → Proxy CGLIB → TransactionInterceptor → JpaTransactionManager.",
         (None, OUT(q1, "fade", 0, 0.3)), ("Controller gọi", STEP("t1a1", p1)), ("rồi Interceptor", STEP("t1a2", i1)),
         ("rồi transaction", STEP("t1a3", m1, lit=True))),
    beat("Transaction manager lấy connection, tắt autocommit, gắn vào Thread Local. Rồi mới gọi target thật.",
         "Lấy connection, tắt autocommit, gắn vào ThreadLocal, rồi mới gọi target thật.",
         (None, [LIGHT(m1, 0.2)]), ("gắn vào", STEP("t1a5", tl1, lit=True) + [IN("#t1tn", "fade", 0.9, 0.4)]),
         ("Rồi mới", STEP("t1a4", s1))),
    beat("Kết thúc thì sao? Thành công thì commit. Runtime exception và Error thì rollback. Còn checked exception, mặc định vẫn commit.",
         "Thành công: commit. RuntimeException, Error: rollback. Checked exception: vẫn commit.",
         ("Thành công", IN(k1, "left", 0, 0.5)), ("Runtime", IN(k2, "left", 0, 0.5)), ("Còn checked", [IN(k3, "left", 0, 0.5), PULSE(k3, 0.6)])),
    beat("Sơ đồ hai: self-invocation. Method createOrders gọi this chấm createOne. Transaction có chạy không? Đoán đi.",
         "Sơ đồ 2: createOrders gọi this.createOne(). @Transactional có chạy không?",
         (None, [d1.out(0), IN("#t2la", "fade", 0.7, 0.4)]),
         (None, ND("#t2c", 0.6) + STEP("t2a1", "#t2p", 0.9) + STEP("t2a2", "#t2o", 1.6)),
         ("Transaction có chạy", IN(q2, "pop", 0, 0.4))),
    beat("Không chạy. This gọi thẳng vào target, không qua proxy, nên Transactional bị bỏ qua.",
         "this.createOne() gọi thẳng target, không qua proxy: @Transactional bị bỏ qua.",
         (None, OUT(q2, "fade", 0, 0.3)), ("This gọi thẳng", STEP("t2a3", "#t2x", 0, lit=False) + [SHAKE("#t2x", 1.2)]),
         ("nên Transactional", IN("#t2kx", "left", 0, 0.5))),
    beat("Cách sửa: tách sang bean khác. Lời gọi đi qua proxy của nó, và transaction mở được. Cùng bẫy với Async và Cacheable.",
         "Tách sang bean khác: gọi qua proxy của nó. Cùng bẫy với @Async, @Cacheable.",
         (None, [DIM("#t2la, #t2c, #t2p, #t2o, #t2x, #t2kx, #t2a1, #t2a2, #t2a3", 0.1, 0.25), IN("#t2lb", "fade", 0.3, 0.4), ND("#t2o2", 0.4)]),
         ("Lời gọi", STEP("t2b1", "#t2w")), ("và transaction", STEP("t2b2", "#t2e", lit=True) + [IN("#t2ke", "left", 0.8, 0.5)])),
    beat("Sơ đồ ba: propagation. Outer và inner dùng propagation mặc định, nên chung một transaction.",
         "Sơ đồ 3: outer() và inner() đều REQUIRED, dùng chung một transaction.",
         (None, [d2.out(0)]), (None, ND("#t3o", 0.7) + STEP("t3a1", "#t3i", 1.0) + [IN("#t3k1", "left", 2.2, 0.5)]) ),
    beat("Inner ném exception, transaction bị đánh dấu rollback only. Outer nuốt exception. Đoán xem lúc commit thì sao?",
         "inner() ném exception: Tx bị đánh dấu rollback-only. outer() nuốt exception. Commit thì sao?",
         (None, STEP("t3a2", "#t3r", 0.3) + [SHAKE("#t3r", 1.4)]), ("Đoán xem", IN(q3, "pop", 0, 0.4))),
    beat("Rồi outer gọi auditLog, propagation Requires New: mở transaction hai trên connection thứ hai, commit riêng. Audit được lưu, nhưng tốn hai connection.",
         "auditLog() REQUIRES_NEW: suspend Tx1, Tx2 commit riêng. Audit được lưu, tốn 2 connection.",
         (None, [DIM("#t3o, #t3i, #t3r, #t3a1, #t3a2, #t3k1", 0.1, 0.3), ND("#t3au", 0.3)]),
         ("mở transaction hai", STEP("t3b1", "#t3t2", 0, lit=True)), ("Audit được lưu", [IN("#t3k2", "left", 0, 0.5)])),
    beat("Cuối cùng outer commit. Transaction đang rollback only, nên ném Unexpected Rollback Exception.",
         "outer commit: Tx1 đang rollback-only, nên ném UnexpectedRollbackException.",
         (None, OUT(q3, "fade", 0, 0.3)), ("Cuối cùng", STEP("t3b2", "#t3oc")), ("nên ném", STEP("t3b3", "#t3u", lit=False) + [SHAKE("#t3u", 1.0)])),
])

# ================================================================== jpa
d4 = D("j4")
d4.n("t", 90, 330, 280, "Transient", "amber")
d4.n("m", 620, 330, 280, "Managed", "green")
d4.n("d", 1150, 330, 280, "Detached", "violet")
d4.n("r", 620, 540, 280, "Removed", "red")
d4.a("a1", "t", "m"); d4.a("a2", "m", "d")
d4.a("a3", "d", "m", tone="green", pts=[(1290, 322), (1290, 250), (760, 250), (760, 322)])
d4.a("a4", "m", "r", "d", tone="red")
d4.t("l1", 370, 312, 250, "persist()", "note")
d4.t("l2", 900, 312, 250, "hết Tx, clear()", "note")
d4.t("l3", 800, 195, 700, "merge(): trả về bản managed mới", "lbl")
d4.t("l4", 940, 560, 600, "remove(), flush: DELETE", "note left")
d4.c("k1", 90, 740, "Chỉ Managed mới được dirty checking", "green")
d4.c("k2", 90, 820, "Detached chạm lazy: LazyInitializationException", "red")
q4 = d4.q("q")

d5 = D("j5")
d5.n("fa", 90, 250, 300, "findAll()", "amber")
d5.n("q1", 500, 250, 380, "1 query: orders", "cyan")
d5.n("qn", 990, 250, 460, "N query: items", "red")
d5.n("jf", 90, 450, 640, "JOIN FETCH / @EntityGraph", "green")
d5.n("j1", 850, 450, 300, "1 query", "green")
d5.n("bf", 90, 640, 640, "batch_fetch_size = 50", "violet")
d5.n("b1", 850, 640, 420, "1 + N/50 query", "violet")
d5.a("a1", "fa", "q1"); d5.a("a2", "q1", "qn", tone="red")
d5.a("b1a", "jf", "j1", tone="green"); d5.a("b2a", "bf", "b1", tone="violet")
d5.c("k1", 1520, 272, "1 + N", "red")
d5.c("k2", 90, 810, "JOIN FETCH collection + Pageable: phân trang trong bộ nhớ", "amber")
q5 = d5.q("q")

jpa = scene("jpa", "j0", "JPA", "Sơ đồ 4 và 5", [d4, d5], [
    beat("Phần hai: JPA. Sơ đồ bốn: từ new, entity đi tới trạng thái nào?",
         "Sơ đồ 4: từ new, entity đi tới trạng thái nào?",
         (None, [IN("#j0-hud", "left", 0.1)]), ("Sơ đồ bốn", ND("#j4t", 0)), ("entity đi", IN(q4, "pop", 0, 0.4))),
    beat("Transient, persist thành Managed. Hết transaction hoặc clear thì Detached. Merge trả về bản managed mới, đừng dùng object cũ.",
         "persist() → Managed. Hết Tx hoặc clear() → Detached. merge() trả về bản managed mới.",
         (None, OUT(q4, "fade", 0, 0.3)), ("persist thành", [IN("#j4l1", "fade", 0, 0.4)] + STEP("j4a1", "#j4m", 0.3, lit=True)),
         ("Hết transaction", [IN("#j4l2", "fade", 0, 0.4)] + STEP("j4a2", "#j4d", 0.3)),
         ("Merge trả về", [IN("#j4l3", "fade", 0, 0.4)] + AR("j4a3", 0.3))),
    beat("Remove thì sang Removed. Chỉ Managed mới dirty checking, còn Detached chạm lazy là Lazy Initialization Exception.",
         "remove() → Removed. Chỉ Managed mới dirty checking; Detached chạm lazy: LazyInitializationException.",
         (None, [IN("#j4l4", "fade", 0.3, 0.4)] + STEP("j4a4", "#j4r", 0)), ("Chỉ Managed", IN("#j4k1", "left", 0, 0.5)),
         ("còn Detached", IN("#j4k2", "left", 0, 0.5))),
    beat("Sơ đồ năm: N+1. Một query lấy order, rồi mỗi order thêm một query lấy items. Tổng bao nhiêu query?",
         "Sơ đồ 5: 1 query lấy orders, rồi mỗi order thêm 1 query lấy items. Tổng bao nhiêu?",
         (None, [d4.out(0)]), (None, ND("#j5fa", 0.6) + STEP("j5a1", "#j5q1", 0.9)), ("rồi mỗi", STEP("j5a2", "#j5qn")),
         ("Tổng bao nhiêu", IN(q5, "pop", 0, 0.4))),
    beat("Một cộng N. JOIN FETCH hoặc EntityGraph còn một query. Batch fetch size năm mươi còn một cộng N chia năm mươi.",
         "1 + N. JOIN FETCH / @EntityGraph: 1 query. batch_fetch_size = 50: 1 + N/50.",
         (None, [IN("#j5k2", "left", 5.5, 0.5)]),
         (None, [OUT(q5, "fade", 0, 0.3), IN("#j5k1", "pop", 0.2, 0.4), SHAKE("#j5qn", 0.3)]),
         ("JOIN FETCH", ND("#j5jf", 0) + STEP("j5b1a", "#j5j1", 0.5, lit=True)),
         ("Batch fetch", ND("#j5bf", 0) + STEP("j5b2a", "#j5b1", 0.5, lit=True))),
])

# ================================================================== java core
d6 = D("h6")
d6.n("a", 90, 230, 270, "put(k, v)", "amber")
d6.n("b", 450, 230, 400, "index=(n-1)&hash", "cyan")
d6.n("c", 940, 230, 330, "Bucket rỗng?", "violet")
d6.n("d", 1360, 230, 300, "Tạo Node", "green")
d6.n("h", 940, 400, 330, "Thêm vào list", "cyan")
d6.n("i", 940, 560, 330, "Quá 8 node?", "violet")
d6.n("j", 520, 560, 330, "Capacity ≥ 64?", "violet")
d6.n("k", 90, 560, 330, "Chuyển thành cây", "green")
d6.a("a1", "a", "b"); d6.a("a2", "b", "c"); d6.a("a3", "c", "d", tone="green")
d6.a("a4", "c", "h", "d"); d6.a("a5", "h", "i", "d"); d6.a("a6", "i", "j", "l"); d6.a("a7", "j", "k", "l", tone="green")
d6.t("lc", 1275, 190, 90, "có", "lbl")
d6.t("lh", 1300, 420, 560, "Cùng hash và equals: ghi đè value", "note left")
d6.c("kr", 520, 670, "chưa đủ 64: resize", "amber")
d6.c("ks", 90, 790, "++size > 0,75 × capacity: resize gấp đôi", "amber")
d6.c("kn", 90, 870, "16 · 0,75 · 8 · 64 · 6", "violet")
q6 = d6.q("q")

d7 = D("e7")
d7.n("s", 90, 210, 400, "execute(task)", "amber")
d7.n("a", 90, 350, 400, "thread < core?", "violet")
d7.n("ac", 640, 350, 400, "Tạo thread core", "green")
d7.n("b", 90, 500, 400, "Queue còn chỗ?", "violet")
d7.n("bc", 640, 500, 400, "Vào queue", "cyan")
d7.n("c", 90, 650, 400, "thread < max?", "violet")
d7.n("cc", 640, 650, 440, "Tạo thread non-core", "green")
d7.n("r", 90, 800, 500, "RejectedExecutionHandler", "red")
d7.a("a0", "s", "a", "d"); d7.a("a1", "a", "b", "d"); d7.a("a2", "b", "c", "d"); d7.a("a3", "c", "r", "d", tone="red")
d7.a("y1", "a", "ac", tone="green"); d7.a("y2", "b", "bc"); d7.a("y3", "c", "cc", tone="green")
d7.t("n1", 1100, 365, 700, "có: tạo thread core", "note left")
d7.t("n2", 1130, 515, 700, "có: xếp vào queue trước", "note left")
d7.t("n3", 1130, 665, 700, "chỉ khi queue đầy", "note left")
d7.c("k1", 660, 740, "AbortPolicy (mặc định): ném exception", "red")
d7.c("k2", 660, 820, "CallerRunsPolicy: back-pressure", "amber")
d7.c("k3", 660, 900, "Queue không giới hạn: không bao giờ lên max, dồn tới OOM", "red")
q7 = d7.q("q")

jc = scene("javacore", "h0", "Java core", "Sơ đồ 6 và 7", [d6, d7], [
    beat("Phần ba: Java core. Sơ đồ sáu, HashMap pút. Từ key đến bucket là hai phép tính nào?",
         "Sơ đồ 6: HashMap.put(). Từ key đến bucket cần hai phép tính nào?",
         (None, [IN("#h0-hud", "left", 0.1)]), ("Sơ đồ sáu", ND("#h6a", 0)), ("hai phép", IN(q6, "pop", 0, 0.4))),
    beat("Hash trộn phần cao xuống phần thấp, rồi lấy chỉ số. Ô rỗng thì tạo Node. Còn node thì thêm vào list, trùng key thì ghi đè.",
         "hash trộn bit cao, index = (n - 1) & hash. Bucket rỗng: tạo Node. Có node: thêm vào list.",
         (None, OUT(q6, "fade", 0, 0.3)), ("Hash trộn", STEP("h6a1", "#h6b")), ("Ô rỗng", STEP("h6a2", "#h6c")),
         ("thì tạo Node", [IN("#h6lc", "fade", 0, 0.3)] + STEP("h6a3", "#h6d")),
         ("Còn node", STEP("h6a4", "#h6h")), ("trùng key", IN("#h6lh", "fade", 0, 0.5))),
    beat("Bucket vượt tám node thì sao? Capacity từ sáu mươi tư trở lên thì chuyển thành cây. Chưa đủ thì resize.",
         "Vượt 8 node: capacity ≥ 64 thì chuyển thành cây, chưa đủ thì resize.",
         (None, STEP("h6a5", "#h6i")), ("Capacity từ", STEP("h6a6", "#h6j")), ("thì chuyển", STEP("h6a7", "#h6k", lit=True)),
         ("Chưa đủ", IN("#h6kr", "left", 0, 0.5))),
    beat("Cuối cùng, size vượt capacity nhân không phẩy bảy lăm thì resize gấp đôi. Năm con số cần nhớ nằm trên màn hình.",
         "size > capacity × 0,75: resize gấp đôi. Nhớ 16, 0,75, 8, 64, 6.",
         (None, IN("#h6ks", "left", 0.2, 0.5)), ("Năm con số", [IN("#h6kn", "left", 0, 0.5), PULSE("#h6kn", 0.7)])),
    beat("Sơ đồ bảy: Thread Pool Executor. Thread chưa tới core thì làm gì? Rồi sao nữa?",
         "Sơ đồ 7: thread chưa tới core thì làm gì? Rồi sao nữa?",
         (None, [d6.out(0)]), (None, ND("#e7s", 0.6) + STEP("e7a0", "#e7a", 1.0)), ("Thread chưa tới", IN(q7, "pop", 0, 0.4))),
    beat("Ít hơn core thì tạo thread core. Không thì xếp vào queue trước. Queue đầy mà chưa tới max mới tạo thread non-core. Hết chỗ thì reject.",
         "core → queue → tạo tới max → reject. Queue đứng trước max.",
         (None, [OUT(q7, "fade", 0, 0.3)] + STEP("e7y1", "#e7ac") + [IN("#e7n1", "fade", 0.9, 0.4)]),
         ("Không thì", STEP("e7a1", "#e7b") + STEP("e7y2", "#e7bc", 0.9) + [IN("#e7n2", "fade", 1.5, 0.4)]),
         ("Queue đầy", STEP("e7a2", "#e7c") + STEP("e7y3", "#e7cc", 0.9) + [IN("#e7n3", "fade", 1.5, 0.4)]),
         ("Hết chỗ", STEP("e7a3", "#e7r"))),
    beat("Reject mặc định là Abort Policy, ném exception. Caller Runs Policy tạo back-pressure. Bẫy: queue không giới hạn thì pool không bao giờ lên max.",
         "AbortPolicy ném exception. CallerRunsPolicy: back-pressure. Queue không giới hạn: dồn tới OOM.",
         (None, IN("#e7k1", "left", 0.2, 0.5)), ("Caller Runs", IN("#e7k2", "left", 0, 0.5)), ("Bẫy", [IN("#e7k3", "left", 0, 0.5), PULSE("#e7k3", 0.8)])),
])

# ================================================================== spring
d8 = D("m8")
d8.n("t", 100, 240, 360, "Tomcat thread", "amber")
d8.n("f", 550, 240, 360, "Filter chain", "violet")
d8.n("d", 1000, 240, 360, "DispatcherServlet", "cyan")
d8.n("h", 1450, 240, 360, "HandlerMapping", "cyan")
d8.n("pre", 1450, 420, 360, "preHandle", "violet")
d8.n("ad", 1000, 420, 360, "HandlerAdapter", "cyan")
d8.n("ct", 550, 420, 360, "Controller", "green")
d8.n("post", 100, 420, 360, "postHandle", "violet")
for k, (a, b) in dict(a1=("t", "f"), a2=("f", "d"), a3=("d", "h")).items():
    d8.a(k, a, b)
d8.a("a4", "h", "pre", "d"); d8.a("a5", "pre", "ad", "l"); d8.a("a6", "ad", "ct", "l", tone="green"); d8.a("a7", "ct", "post", "l")
d8.c("k1", 100, 580, "HttpMessageConverter đọc body, @Valid", "cyan")
d8.c("k2", 100, 660, "Có exception: @RestControllerAdvice, bỏ qua postHandle", "red")
d8.c("k3", 100, 740, "afterCompletion luôn chạy", "green")
q8 = d8.q("q")

d9 = D("b9")
d9.n("a", 100, 230, 320, "Instantiate", "amber")
d9.n("b", 460, 230, 320, "Populate", "cyan")
d9.n("c", 820, 230, 320, "Aware", "cyan")
d9.n("d", 1180, 230, 320, "@PostConstruct", "violet")
d9.n("e", 1540, 230, 320, "InitializingBean", "violet")
d9.n("f", 1500, 420, 360, "After init: proxy", "red")
d9.n("g", 980, 420, 320, "Sẵn sàng", "green")
d9.n("h", 540, 420, 320, "@PreDestroy", "violet")
d9.a("a1", "a", "b"); d9.a("a2", "b", "c"); d9.a("a3", "c", "d"); d9.a("a4", "d", "e")
d9.a("a5", "e", "f", pts=[(1700, 312), (1680, 414)])
d9.a("a6", "f", "g", "l", tone="green"); d9.a("a7", "g", "h", "l")
d9.c("k1", 100, 600, "Proxy tạo sau @PostConstruct: dùng ApplicationReadyEvent", "amber")
q9 = d9.q("q")

d10 = D("a10")
d10.n("a", 100, 230, 440, "@SpringBootApplication", "amber")
d10.n("b", 630, 230, 360, "ImportSelector", "violet")
d10.n("c", 1080, 230, 460, "đọc file .imports", "cyan")
d10.n("o1", 100, 450, 330, "OnClass", "violet")
d10.n("o2", 560, 450, 330, "OnProperty", "violet")
d10.n("o3", 1020, 450, 330, "OnMissingBean", "violet")
d10.n("z", 1480, 450, 380, "Tạo bean mặc định", "green")
d10.a("a1", "a", "b"); d10.a("a2", "b", "c")
d10.a("a3", "c", "o1", pts=[(1300, 312), (1300, 380), (265, 380), (265, 444)])
d10.a("a4", "o1", "o2"); d10.a("a5", "o2", "o3"); d10.a("a6", "o3", "z", tone="green")
d10.t("lc", 100, 560, 800, "@Conditional...: class, property, chưa có bean", "lbl")
d10.c("k1", 100, 680, "Bean của bạn (@ComponentScan) xử lý trước: auto-config lùi lại", "amber")
d10.c("k2", 100, 760, "Debug: --debug hoặc /actuator/conditions", "violet")
q10 = d10.q("q")

sp = scene("spring", "s0", "Spring", "Sơ đồ 8 đến 10", [d8, d9, d10], [
    beat("Phần bốn: Spring. Sơ đồ tám, luồng MVC. Request vào filter, rồi tới ai?",
         "Sơ đồ 8: request vào filter, rồi tới ai?",
         (None, [IN("#s0-hud", "left", 0.1)]), ("Sơ đồ tám", ND("#m8t") + STEP("m8a1", "#m8f", 1.6)), ("Request vào", IN(q8, "pop", 0, 0.4))),
    beat("Dispatcher Servlet nhờ Handler Mapping tìm controller, chạy pre Handle, rồi Handler Adapter đọc body, validate, gọi controller, rồi post Handle.",
         "DispatcherServlet → HandlerMapping → preHandle → HandlerAdapter → Controller → postHandle.",
         (None, OUT(q8, "fade", 0, 0.3)), ("Dispatcher", STEP("m8a2", "#m8d")), ("nhờ Handler", STEP("m8a3", "#m8h")),
         ("chạy pre", STEP("m8a4", "#m8pre")), ("rồi Handler Adapter", STEP("m8a5", "#m8ad") + [IN("#m8k1", "left", 1.0, 0.5)]),
         ("gọi controller", STEP("m8a6", "#m8ct", lit=True)), ("rồi post", STEP("m8a7", "#m8post"))),
    beat("Có exception thì Rest Controller Advice xử lý và bỏ qua post Handle. Còn after Completion thì luôn chạy.",
         "Có exception: @RestControllerAdvice, bỏ qua postHandle. afterCompletion luôn chạy.",
         (None, IN("#m8k2", "left", 0.2, 0.5)), ("Còn after", IN("#m8k3", "left", 0, 0.5))),
    beat("Sơ đồ chín, vòng đời bean. Constructor, gán dependency, Aware, post construct, init bean. Proxy tạo ở đâu?",
         "Sơ đồ 9: constructor, gán dependency, Aware, @PostConstruct, InitializingBean. Proxy tạo ở bước nào?",
         (None, [d8.out(0)]), (None, ND("#b9a", 0.6) + STEP("b9a1", "#b9b", 1.0)), ("Aware", STEP("b9a2", "#b9c")),
         ("post construct", STEP("b9a3", "#b9d")), ("init bean", STEP("b9a4", "#b9e")), ("Proxy tạo", IN(q9, "pop", 0, 0.4))),
    beat("After init mới tạo AOP proxy, sau cả post construct. Nên logic cần transaction lúc khởi động đặt ở Application Ready Event.",
         "After init mới tạo AOP proxy, sau @PostConstruct. Logic cần Tx lúc khởi động: ApplicationReadyEvent.",
         (None, OUT(q9, "fade", 0, 0.3)), (None, STEP("b9a5", "#b9f", lit=True)), ("Nên logic", [IN("#b9k1", "left", 0, 0.5)] + STEP("b9a6", "#b9g", 1.0) + STEP("b9a7", "#b9h", 1.8))),
    beat("Sơ đồ mười, auto-configuration. Selector đọc file imports trong mọi gói jar, mỗi cấu hình qua ba điều kiện. Điều kiện nào quyết định?",
         "Sơ đồ 10: đọc file .imports trong mọi JAR, mỗi cấu hình qua 3 điều kiện. Điều kiện nào quyết định?",
         (None, [d9.out(0)]), (None, ND("#a10a", 0.6) + STEP("a10a1", "#a10b", 1.0)), ("Selector đọc", STEP("a10a2", "#a10c")),
         ("ba điều kiện", STEP("a10a3", "#a10o1") + [IN("#a10lc", "fade", 1.0, 0.4)]), ("Điều kiện nào", IN(q10, "pop", 0, 0.4))),
    beat("Class có trên classpath, property thoả, và bạn chưa tự khai báo bean. Qua hết mới tạo bean mặc định. Bean của bạn xử lý trước, nên auto-config lùi lại. Debug bằng cờ debug.",
         "Qua 3 điều kiện mới tạo bean mặc định. Bean của bạn xử lý trước. Debug: --debug.",
         (None, OUT(q10, "fade", 0, 0.3)), ("property thoả", STEP("a10a4", "#a10o2")), ("chưa tự khai báo", STEP("a10a5", "#a10o3", lit=True)),
         ("Qua hết", STEP("a10a6", "#a10z", lit=True)), ("Bean của bạn", IN("#a10k1", "left", 0, 0.5)), ("Debug bằng", IN("#a10k2", "left", 0, 0.5))),
])

# ================================================================== security + cache
d11 = D("s11")
d11.t("la", 100, 205, 800, "Đăng nhập", "lbl")
d11.t("lb", 100, 455, 800, "Gọi API", "lbl")
d11.n("c", 100, 270, 260, "Client", "amber")
d11.n("m", 460, 270, 360, "AuthManager", "violet")
d11.n("u", 920, 270, 420, "UserDetails+BCrypt", "cyan")
d11.n("t", 1440, 270, 400, "access + refresh", "green")
d11.n("b", 100, 520, 300, "Bearer token", "amber")
d11.n("v", 500, 520, 380, "Verify chữ ký, exp", "violet")
d11.n("x", 980, 520, 340, "SecurityContext", "cyan")
d11.n("z", 1420, 520, 420, "AuthorizationFilter", "green")
d11.a("a1", "c", "m"); d11.a("a2", "m", "u"); d11.a("a3", "u", "t", tone="green")
d11.a("b1", "b", "v"); d11.a("b2", "v", "x"); d11.a("b3", "x", "z", tone="green")
d11.c("k1", 100, 690, "Token sai hoặc hết hạn: 401", "red")
d11.c("k2", 100, 770, "Thiếu quyền: 403", "amber")
d11.c("k3", 480, 770, "SecurityContextHolder là ThreadLocal", "violet")
q11 = d11.q("q")

d12 = D("c12")
d12.n("s", 100, 230, 260, "Service", "amber")
d12.n("g", 460, 230, 320, "Redis GET", "cyan")
d12.n("h", 880, 230, 320, "Hit: trả về", "green")
d12.n("db", 460, 390, 340, "Miss: SELECT DB", "violet")
d12.n("set", 900, 390, 440, "SET + TTL + jitter", "cyan")
d12.n("u", 100, 550, 320, "UPDATE DB", "amber")
d12.n("del", 520, 550, 320, "DEL key", "red")
d12.a("a1", "s", "g"); d12.a("a2", "g", "h", tone="green"); d12.a("a3", "g", "db", "d", tone="violet"); d12.a("a4", "db", "set")
d12.a("b1", "u", "del")
d12.t("ld", 880, 570, 900, "lần đọc sau tự load bản mới", "note left")
d12.c("k1", 100, 700, "Penetration: key không tồn tại", "red")
d12.c("k2", 100, 780, "Stampede: key nóng hết hạn: lock hoặc single-flight", "red")
d12.c("k3", 100, 860, "Avalanche: hết hạn cùng lúc: TTL có jitter", "red")
q12 = d12.q("q")

sc = scene("securitycache", "c0", "Security và cache", "Sơ đồ 11 và 12", [d11, d12], [
    beat("Phần năm: Security và cache. Sơ đồ mười một. Đăng nhập: so khớp hash BCrypt, rồi trả về hai token. Còn gọi API thì sao?",
         "Sơ đồ 11: đăng nhập, so khớp hash BCrypt, trả 2 token. Còn gọi API thì sao?",
         (None, [IN("#c0-hud", "left", 0.1), IN("#s11la", "fade", 0.3, 0.4)]), ("Đăng nhập", ND("#s11c", 0.2) + STEP("s11a1", "#s11m", 0.8)), ("so khớp hash", STEP("s11a2", "#s11u")), ("trả về", STEP("s11a3", "#s11t", lit=True)), ("Còn gọi API", [IN("#s11lb", "fade", 0, 0.4)] + ND("#s11b", 0.4) + [IN(q11, "pop", 0.0, 0.4)])),
    beat("Filter verify chữ ký và hạn exp, đặt Authentication vào Security Context, là Thread Local. Cuối cùng kiểm tra quyền.",
         "Verify chữ ký và exp, đặt Authentication vào SecurityContext (ThreadLocal), rồi kiểm tra quyền.",
         (None, OUT(q11, "fade", 0, 0.3)), ("Filter verify", STEP("s11b1", "#s11v")), ("đặt Authentication", STEP("s11b2", "#s11x") + [IN("#s11k3", "left", 1.0, 0.5)]),
         ("Cuối cùng", STEP("s11b3", "#s11z", lit=True))),
    beat("Token sai hoặc hết hạn là bốn không một. Thiếu quyền là bốn không ba.",
         "Token sai hoặc hết hạn: 401. Thiếu quyền: 403.",
         (None, IN("#s11k1", "left", 0.2, 0.5)), ("Thiếu quyền", IN("#s11k2", "left", 0, 0.5))),
    beat("Sơ đồ mười hai: cache-aside. Đọc thì hỏi Redis trước. Hit thì trả luôn. Còn miss thì sao?",
         "Sơ đồ 12: đọc thì hỏi Redis trước. Hit thì trả luôn. Miss thì sao?",
         (None, [d11.out(0)]), (None, ND("#c12s", 0.6) + STEP("c12a1", "#c12g", 1.0)), ("Hit thì", STEP("c12a2", "#c12h", lit=True)),
         ("Còn miss", IN(q12, "pop", 0, 0.4))),
    beat("Miss thì đọc database, rồi set vào Redis kèm TTL và jitter. Ghi thì update database rồi xoá key.",
         "Miss: SELECT rồi SET kèm TTL + jitter. Ghi: UPDATE DB rồi DEL key.",
         (None, OUT(q12, "fade", 0, 0.3)), ("Miss thì", STEP("c12a3", "#c12db")), ("rồi set", STEP("c12a4", "#c12set")),
         ("Ghi thì", ND("#c12u") + STEP("c12b1", "#c12del", 0.5)), (None, IN("#c12ld", "fade", 5.0, 0.5))),
    beat("Ba sự cố: penetration là key không tồn tại. Stampede là key nóng hết hạn, sửa bằng lock hoặc single flight. Avalanche là hết hạn cùng lúc, sửa bằng jitter.",
         "Penetration · Stampede: lock hoặc single-flight · Avalanche: TTL có jitter.",
         (None, IN("#c12k1", "left", 0.2, 0.5)), ("Stampede", IN("#c12k2", "left", 0, 0.5)), ("Avalanche", [IN("#c12k3", "left", 0, 0.5), PULSE("#c12k3", 0.8)])),
])

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 215, 1920, None, letters("Vẽ lại cơ chế này đi"), "h1 center r"),
        chip("hk-1", 300, 400, "@Transactional", "cyan"), chip("hk-2", 760, 400, "Self-invocation", "cyan"), chip("hk-3", 1220, 400, "Propagation", "cyan"),
        chip("hk-4", 300, 490, "Entity state", "violet"), chip("hk-5", 760, 490, "N+1", "violet"), chip("hk-6", 1220, 490, "HashMap.put", "amber"),
        chip("hk-7", 300, 580, "ThreadPool", "amber"), chip("hk-8", 760, 580, "Luồng MVC", "green"), chip("hk-9", 1220, 580, "Vòng đời bean", "green"),
        chip("hk-10", 300, 670, "Auto-config", "green"), chip("hk-11", 760, 670, "Security + JWT", "red"), chip("hk-12", 1220, 670, "Cache-aside", "red"),
        tile("hk-tile", 400, 350, 220, "share"),
        el("hk-word", 670, 380, 1200, None, letters("12 sơ đồ cốt lõi"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "Vẽ từng mũi tên · đoán trước · rồi xem đáp án", "kin-sub r"),
    ]), beats=[
        beat("Phỏng vấn viên đưa bạn một tờ giấy trắng và nói: vẽ lại cơ chế này đi.",
             "Một tờ giấy trắng: vẽ lại cơ chế này đi.",
             (None, [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)])),
        beat("Mười hai sơ đồ hay bị hỏi: transaction, JPA, HashMap, thread pool, luồng MVC, bean, Security và cache.",
             "12 sơ đồ hay bị hỏi nhất: transaction, JPA, HashMap, thread pool, MVC, bean, Security, cache.",
             ("transaction", [IN("#hk-1, #hk-2, #hk-3", "pop", 0, 0.4, 0.15)]), ("JPA", [IN("#hk-4, #hk-5", "pop", 0, 0.4, 0.15)]),
             ("HashMap", [IN("#hk-6, #hk-7", "pop", 0, 0.4, 0.15)]), ("luồng MVC", [IN("#hk-8, #hk-9, #hk-10", "pop", 0, 0.4, 0.15)]),
             ("Security", [IN("#hk-11, #hk-12", "pop", 0, 0.4, 0.15)])),
        beat("Hôm nay ta vẽ lại từng sơ đồ. Mỗi mũi tên, bạn đoán trước rồi mới xem đáp án.",
             "Mỗi mũi tên: đoán trước, rồi xem đáp án.",
             (None, [OUT("#hk-eye, #hk-q, #hk-1, #hk-2, #hk-3, #hk-4, #hk-5, #hk-6, #hk-7, #hk-8, #hk-9, #hk-10, #hk-11, #hk-12", "blur", 0, 0.45),
                     IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 1.6)])),
    ]),
    tx, jpa, jc, sp, sc,
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Năm nhóm sơ đồ cần vẽ được"), "h1 center r"),
        card4("ou-c", 100, 290, 320, 300, 30, [("lock", "Transaction", "proxy, ThreadLocal"),
                                                ("tree", "JPA", "entity state, 1 + N"),
                                                ("hash", "Java core", "HashMap, thread pool"),
                                                ("shapes", "Spring", "MVC, bean, auto-config"),
                                                ("shield", "Security + cache", "401 và 403, cache-aside")]),
        el("ou-cta", 0, 740, 1920, None, "Mở bài học tương tác để dựng lại sơ đồ từ trí nhớ", "cta r"),
    ]), beats=[
        beat("Tóm lại: năm nhóm. Proxy, entity state, HashMap và thread pool, bean và request, token và cache.",
             "Proxy + ThreadLocal · entity state + N+1 · HashMap + thread pool · bean + request · token + cache.",
             (None, TYPE("#ou-h", 0, 0.03)), ("Proxy", IN("#ou-c0", "pop", 0.0, 0.5)), ("entity", IN("#ou-c1", "pop", 0, 0.5)),
             ("HashMap", IN("#ou-c2", "pop", 0, 0.5)), ("bean và", IN("#ou-c3", "pop", 0, 0.5)), ("token và", IN("#ou-c4", "pop", 0, 0.5))),
        beat("Gấp tài liệu lại, tự vẽ ra giấy, nói to từng mũi tên. Chỗ vẽ sai là chỗ chưa hiểu. Mở bài học tương tác để dựng lại nhé.",
             "Gấp lại, tự vẽ ra giấy, nói to từng mũi tên. Mở bài học tương tác để dựng lại nhé.",
             (None, [IN("#ou-cta", "blur", 0.2), PULSE("#ou-cta", 5.0)])),
    ]),
]

fit_to_audio(SCENES, __file__)
