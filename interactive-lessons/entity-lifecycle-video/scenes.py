"""Entity Lifecycle & Persistence Context explainer: scene layouts and per-beat narration + motion.

Measured on Spring Boot 3.5 + Hibernate ORM 6.6 + PostgreSQL 16.14 (Docker), JDK 21, query counts from Hibernate statistics
(getPrepareStatementCount), study note 05.06 and web lesson entity-lifecycle.ts:
setter in @Transactional without save() -> 1 UPDATE; same value, readOnly = true, detached -> 0 UPDATE; editing a detached entity
inside another transaction -> 0 UPDATE; merge: managed == detached false, contains(detached) false, contains(managed) true, editing
the old object after merge leaves the old name in the DB; save() = isNew() ? persist : merge, isNew() checks a wrapper @Version
for null, otherwise the id; Tag("java") with an assigned id -> select + insert, 2 SQL; 2 x findById in one tx -> 1 query a == b true,
without an outer tx -> 2 queries false, findById then JPQL same id -> 2 queries a == b true, another tx renames to "Binh" and commits
but JPQL still sees "An"; second-level cache off (HHH000026); default UPDATE sets every column
(update product set name=?,stock=?,version=? where id=? and version=?); flush counts: persist 0, JPQL on Product 0, JPQL on
Customer 1, native query 2; IDENTITY: 1000 persist -> 1000 INSERT; flush order INSERT -> UPDATE -> collection -> DELETE,
remove then persist with the same email -> duplicate key value violates unique constraint "member_email_key".
Detached after the transaction only with OSIV off; with OSIV on (Boot default) the context stays open until the request ends.
No Java is run for this video: every snippet is Spring/Hibernate code whose numbers come from the measured lesson.
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)


def ARR(id_, d=0.0, dur=0.5):
    """Draw an arrow and pop its head, without the travelling light dot."""
    return [DRAW(f"#{id_}-p", d, dur), IN(f"#{id_}-h", "pop", d + dur - 0.05, 0.25)]


def row(id_, y, left, right, tone):
    """One measured step: code on the left, the count on the right."""
    return box(id_, 160, y, 1600, 76, f'<span class="mono">{esc(left)}</span><span class="mono big">{esc(right)}</span>', tone, "row")


SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 150, 1300, None, "Câu hỏi phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 210, 1920, None, letters("Không gọi save(), DB có đổi không?"), "h1 center r"),
        box("hk-code", 460, 340, 1000, 250, code(
            '@Transactional\npublic void rename(Long id) {\n    Customer c = repo.findById(id).orElseThrow();\n'
            '    c.setName("Binh");   // không gọi save()\n}'), "cyan", "code"),
        el("hk-st", 660, 640, 600, None, "Đã đo: đúng 1 câu UPDATE", "stamp green r"),
        tile("hk-tile", 330, 350, 220, "box"),
        el("hk-word", 600, 380, 1300, None, letters("Entity Lifecycle"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "4 trạng thái · merge · first-level cache · dirty checking · flush", "kin-sub r"),
    ]), beats=[
        ("Trong một method có Transactional, bạn find by id, gọi set name, và không hề gọi save. Database có đổi không?",
         "Trong @Transactional: findById, setName, không gọi save(). DB có đổi không?",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03), IN("#hk-code", "up", 2.2, 0.6)]),
        ("Có. Đã đo thật: đúng một câu update. Không phải nhờ save, mà nhờ dirty checking.",
         "Có: đã đo đúng 1 câu UPDATE, nhờ dirty checking chứ không nhờ save().",
         [IN("#hk-st", "stamp", 0.5, 0.45)]),
        ("Hôm nay ta học vòng đời của entity, và persistence context.", "Hôm nay: Entity Lifecycle & Persistence Context.",
         [OUT("#hk-eye, #hk-q, #hk-code, #hk-st", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05),
          IN("#hk-sub", "blur", 1.6)]),
    ]),
    # ------------------------------------------------------------ three layers
    dict(id="layers", world=(1920, 1080), hud=hud("ly", "JPA, Hibernate, Spring Data JPA", "Ba tầng chồng lên nhau"), cam="".join([
        big_title("ly", "Ba tầng, ba vai", "JPA · Hibernate · Spring Data JPA"),
        gnode("ly-n0", 160, 190, 700, 80, "orderRepo.save(o)", "amber"),
        gnode("ly-n1", 160, 306, 700, 80, "Spring Data JPA", "violet"),
        gnode("ly-n2", 160, 422, 700, 80, "JPA · EntityManager", "violet"),
        gnode("ly-n3", 160, 538, 700, 80, "Hibernate", "cyan"),
        gnode("ly-n4", 160, 654, 700, 80, "JDBC + HikariCP", "green"),
        el("ly-d0", 920, 210, 840, None, "Code của bạn gọi repository", "note left r"),
        el("ly-d1", 920, 326, 840, None, "SimpleJpaRepository: derived query, Pageable", "note left r"),
        el("ly-d2", 920, 442, 840, None, "Specification: interface + annotation, không tự chạy", "note left r"),
        el("ly-d3", 920, 558, 840, None, "Implementation: ORM thật sự, sinh SQL, cache, proxy", "note left r"),
        el("ly-d4", 920, 674, 840, None, "PostgreSQL / MySQL", "note left r"),
        chip("ly-wrong", 160, 780, "“Spring Data JPA là ORM”: sai, nó không sinh SQL", "red"),
        chip("ly-ro", 160, 860, "SimpleJpaRepository: readOnly = true ở class, method ghi đánh lại @Transactional", "violet"),
        wires(arrow("ly-a0", [(510, 274), (510, 300)]), arrow("ly-a1", [(510, 390), (510, 416)]),
              arrow("ly-a2", [(510, 506), (510, 532)]), arrow("ly-a3", [(510, 622), (510, 648)])),
    ]), beats=[
        ("Phần một: ba cái tên hay bị dùng lẫn lộn. Thật ra JPA, Hibernate và Spring Data JPA là ba tầng chồng lên nhau.",
         "Phần 1: JPA, Hibernate và Spring Data JPA là ba tầng chồng lên nhau.",
         [TYPE("#ly-big", 0.1, 0.06), IN("#ly-bsub", "blur", 0.9), OUT("#ly-big, #ly-bsub", "zoom", 4.0), IN("#ly-hud", "left", 4.6),
          IN("#ly-n0", "pop", 5.2), IN("#ly-d0", "fade", 5.6)]),
        ("Gọi save, lớp Spring Data JPA nhận lời gọi rồi gọi xuống Entity Manager, interface của JPA. JPA chỉ là bản đặc tả, không tự chạy.",
         "save() → SimpleJpaRepository → EntityManager.persist() hoặc merge(). JPA chỉ là specification.",
         [*ARR("ly-a0", 0.5), IN("#ly-n1", "pop", 0.8), IN("#ly-d1", "fade", 1.4), *ARR("ly-a1", 3.6), IN("#ly-n2", "pop", 4.0),
          IN("#ly-d2", "fade", 6.6)]),
        ("Hibernate, bản cài đặt của JPA, mới thật sự sinh SQL. Bên dưới là JDBC và connection pool.",
         "Hibernate là implementation: ORM thật sự sinh SQL. Bên dưới là JDBC và HikariCP.",
         [*ARR("ly-a2", 0.0), IN("#ly-n3", "pop", 0.3), IN("#ly-d3", "fade", 1.2), PULSE("#ly-n3", 2.4), *ARR("ly-a3", 3.6),
          IN("#ly-n4", "pop", 4.0), IN("#ly-d4", "fade", 4.6)]),
        ("Vậy nói Spring Data JPA là ORM là sai: nó chỉ gọi Entity Manager, không sinh SQL.",
         "“Spring Data JPA là ORM”: sai. Nó chỉ gọi EntityManager, không sinh SQL.",
         [IN("#ly-wrong", "left", 0.3), SHAKE("#ly-wrong", 1.6)]),
        ("Thêm nữa: Simple Jpa Repository mặc định read only, nên find by id ngoài service có một transaction ngắn riêng.",
         "SimpleJpaRepository: readOnly = true ở class. findById ngoài service có transaction ngắn riêng.",
         [IN("#ly-ro", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ four states
    dict(id="states", world=(1920, 1080), hud=hud("st", "Bốn trạng thái của entity", "Có ai đang theo dõi object không"), cam="".join([
        chip("st-o1", 160, 190, "OSIV tắt: method @Transactional kết thúc → entity thành detached", "amber"),
        chip("st-o2", 160, 270, "OSIV bật (mặc định của Boot): context còn mở tới hết request", "violet"),
        el("st-in", 720, 370, 380, None, "find() · query", "lbl r"),
        gnode("st-t", 160, 480, 300, 100, "Transient", "amber"),
        gnode("st-m", 720, 480, 380, 100, "Managed", "green"),
        gnode("st-d", 1460, 480, 300, 100, "Detached", "violet"),
        gnode("st-r", 720, 750, 380, 100, "Removed", "red"),
        el("st-l1", 470, 476, 232, None, "persist()", "lbl r"),
        el("st-l2", 1105, 452, 350, None, "tx kết thúc · clear()", "lbl r"),
        el("st-l3", 1100, 570, 360, None, "merge(): bản managed khác", "lbl r"),
        el("st-l4", 930, 640, 200, None, "remove()", "lbl r"),
        el("st-l5", 1130, 782, 420, None, "DELETE lúc flush", "lbl r", "text-align:left"),
        chip("st-k", 160, 880, "Đã đo: sửa entity detached trong transaction khác → 0 UPDATE", "red"),
        wires(arrow("st-a0", [(910, 414), (910, 472)]), arrow("st-a1", [(462, 530), (712, 530)]),
              arrow("st-a2", [(1102, 508), (1452, 508)]), arrow("st-a3", [(1458, 556), (1108, 556)]),
              arrow("st-a4", [(910, 582), (910, 742)])),
    ]), beats=[
        ("Phần hai: bốn trạng thái của entity. Vừa new ra là transient: chưa ai theo dõi. Gọi persist thì nó thành managed.",
         "Phần 2: vừa new là Transient, chưa ai theo dõi. persist() → Managed.",
         [IN("#st-hud", "left", 0.1), IN("#st-t", "pop", 3.0), *ARR("st-a1", 5.6), IN("#st-l1", "fade", 5.8), IN("#st-m", "pop", 6.1)]),
        ("Find hay query cũng ra managed. Chỉ entity managed mới có dirty checking và lazy load.",
         "find() hay query cũng ra Managed. Chỉ Managed mới có dirty checking và lazy load.",
         [IN("#st-in", "fade", 0.2), *ARR("st-a0", 0.5), PULSE("#st-m", 2.6)]),
        ("Khi transaction kết thúc, hoặc gọi clear, entity thành detached: vẫn có id, nhưng không còn ai theo dõi.",
         "Hết transaction hoặc clear(): Detached, vẫn có id nhưng không ai theo dõi.",
         [*ARR("st-a2", 0.4), IN("#st-l2", "fade", 0.6), IN("#st-d", "pop", 2.4)]),
        ("Nếu tắt Open Session In View, hết method transactional là entity detached. Bật, như mặc định của Spring Boot, thì context mở tới hết request.",
         "OSIV tắt: hết @Transactional là detached. OSIV bật (mặc định Boot): context mở tới hết request.",
         [IN("#st-o1", "left", 0.5), IN("#st-o2", "left", 5.2)]),
        ("Merge quay lại qua một bản managed khác. Remove thì đánh dấu xoá, câu delete chạy lúc flush.",
         "merge() trả về một bản managed khác. remove() → Removed, DELETE chạy lúc flush.",
         [*ARR("st-a3", 0.2), IN("#st-l3", "fade", 0.5), *ARR("st-a4", 2.9), IN("#st-l4", "fade", 3.0), IN("#st-r", "pop", 3.3),
          IN("#st-l5", "fade", 4.8)]),
        ("Đã đo: sửa entity detached trong một transaction khác, không có câu update nào. Có id chưa chắc là managed.",
         "Đã đo: sửa entity detached trong transaction khác → 0 UPDATE. Có id chưa chắc là managed.",
         [IN("#st-k", "left", 0.4), PULSE("#st-d", 1.6)]),
    ]),
    # ------------------------------------------------------------ persist, merge, save
    dict(id="merge", world=(1920, 1080), hud=hud("mg", "persist, merge và save", "Dùng giá trị trả về"), cam="".join([
        box("mg-p", 160, 190, 760, 140, "<b>persist(e)</b><small>chính object e thành managed</small>", "green", "card"),
        box("mg-m", 1000, 190, 760, 140, "<b>merge(e)</b><small>trả về một bản managed khác, e vẫn detached</small>", "violet", "card"),
        console("mg-con", 160, 350, 1600, ["managed == detached               → false",
                                           "contains(detached) / contains(managed) → false / true",
                                           "sửa detached sau merge, commit    → DB vẫn tên cũ"]),
        box("mg-code", 160, 610, 1000, 130, code("if (entityInformation.isNew(entity)) em.persist(entity);\nelse return em.merge(entity);"),
            "cyan", "code"),
        el("mg-new", 1220, 610, 540, None, "isNew(): có @Version kiểu wrapper thì xét version null, không có thì xét id null", "note left r"),
        box("mg-tag", 160, 190, 1000, 130, code('Tag tag = new Tag("java");   // @Id tự gán\nrepo.save(tag);'), "amber", "code"),
        el("mg-st", 1240, 222, 440, None, "2 câu SQL", "stamp red r"),
        console("mg-sql", 160, 360, 1600, ["select t1_0.code from tag t1_0 where t1_0.code=?", "insert into tag (code) values (?)"]),
        chip("mg-fix", 160, 560, "Sửa: implements Persistable<ID>, hoặc thêm @Version", "green"),
        chip("mg-e1", 160, 640, "persist(detached): EntityExistsException: detached entity passed to persist", "red"),
        chip("mg-e2", 160, 720, "remove(detached): IllegalArgumentException: Removing a detached instance", "red"),
        chip("mg-ret", 160, 800, "Luôn dùng object mà save() trả về", "amber"),
    ]), beats=[
        ("Phần ba: persist, merge và save. Persist biến chính object bạn truyền vào thành managed.",
         "Phần 3: persist(e) biến chính object e thành managed.",
         [IN("#mg-hud", "left", 0.1), IN("#mg-p", "left", 2.6)]),
        ("Còn merge thì khác: nó trả về một bản managed khác, object truyền vào vẫn detached.",
         "merge(e) trả về một bản managed khác; object truyền vào vẫn detached.",
         [IN("#mg-m", "right", 0.3)]),
        ("Đã đo: đó là hai object khác nhau. Sửa object cũ sau merge, database vẫn giữ tên cũ.",
         "Đã đo: managed == detached là false. Sửa object cũ sau merge: DB vẫn tên cũ.",
         [IN("#mg-con", "up", 0.2, 0.4), IN("#mg-con-1", "type1", 0.5, 0.3), IN("#mg-con-2", "type1", 2.0, 0.3),
          IN("#mg-con-3", "type1", 3.0, 0.3)]),
        ("Còn save của Spring Data: entity mới thì persist, không thì merge. Mới nghĩa là version null nếu có field version kiểu wrapper, không thì id null.",
         "save(): isNew() ? persist : merge. isNew(): @Version (wrapper) null, không có thì id null.",
         [IN("#mg-code", "up", 0.4), IN("#mg-new", "fade", 4.6)]),
        ("Một cái bẫy: entity tự gán id như tag java. Id đã có giá trị nên save gọi merge, và merge select trước: hai câu SQL.",
         "Bẫy: Tag(\"java\") tự gán id → save gọi merge → SELECT trước: 2 câu SQL.",
         [OUT("#mg-p, #mg-m, #mg-con, #mg-code, #mg-new", "fade", 0, 0.4), IN("#mg-tag", "up", 0.4), IN("#mg-sql", "up", 2.6, 0.4),
          IN("#mg-sql-1", "type1", 3.4, 0.3), IN("#mg-sql-2", "type1", 4.4, 0.3), IN("#mg-st", "stamp", 6.2, 0.45)]),
        ("Sửa bằng Persistable hoặc field version. Persist hay remove entity detached đều ném exception. Luôn dùng object mà save trả về.",
         "Persistable<ID> hoặc @Version. persist/remove detached ném exception. Dùng object save() trả về.",
         [IN("#mg-fix", "left", 0.3), IN("#mg-e1", "left", 2.8), IN("#mg-e2", "left", 3.8), IN("#mg-ret", "left", 6.6)]),
    ]),
    # ------------------------------------------------------------ persistence context and first-level cache
    dict(id="cache", world=(1920, 1080), hud=hud("ca", "Persistence context", "First-level cache sống theo transaction"), cam="".join([
        el("ca-pc", 160, 190, 800, 410, "<span>PERSISTENCE CONTEXT</span>", "mempanel r"),
        box("ca-e1", 200, 230, 720, 80, "<b>(Customer, 1) → instance</b>", "cyan", "card"),
        box("ca-e2", 200, 330, 720, 80, "<b>snapshot: name = \"An\"</b>", "violet", "card"),
        el("ca-life", 200, 440, 720, None, "Mở và đóng cùng transaction", "note left r"),
        box("ca-r1", 1040, 190, 720, 136, "<b>2 × findById, cùng transaction</b><small>1 query · a == b true</small>", "green", "card"),
        box("ca-r2", 1040, 336, 720, 136, "<b>2 × findById, không tx bao ngoài</b><small>2 query · a == b false</small>", "red", "card"),
        box("ca-r3", 1040, 482, 720, 136, "<b>findById rồi JPQL cùng id</b><small>2 query · nhưng a == b vẫn true</small>", "amber", "card"),
        box("ca-s", 160, 640, 1600, 90, "<b>Tx khác đổi tên thành “Binh” rồi commit: JPQL ở đây vẫn thấy “An”</b>", "amber", "card"),
        chip("ca-fix", 160, 770, "Muốn dữ liệu mới: refresh() hoặc clear()", "green"),
        chip("ca-l2", 160, 850, "Cache dùng chung là second-level cache, mặc định tắt (HHH000026)", "violet"),
    ]), beats=[
        ("Phần bốn: persistence context là một map trong bộ nhớ, từ loại entity và id tới instance, kèm một snapshot. Đó chính là first level cache.",
         "Phần 4: persistence context là Map (loại entity, id) → instance, kèm snapshot: first-level cache.",
         [IN("#ca-hud", "left", 0.1), IN("#ca-pc", "fade", 0.5), IN("#ca-e1", "left", 3.6), IN("#ca-e2", "left", 6.4)]),
        ("Nó sống theo transaction: hai lần find by id trong cùng transaction chỉ một query, và cùng một instance.",
         "Sống theo transaction. 2 lần findById cùng transaction: 1 query, a == b true.",
         [IN("#ca-life", "up", 0.3), IN("#ca-r1", "right", 2.0)]),
        ("Không có transaction bao ngoài thì mỗi lần gọi là một context mới: hai query, hai object khác nhau.",
         "Không có transaction bao ngoài: 2 query, a == b false.",
         [IN("#ca-r2", "right", 0.4)]),
        ("Câu query JPQL thì luôn chạy SQL. Nhưng id đã có trong context thì Hibernate trả lại instance cũ, không ghi đè.",
         "JPQL luôn chạy SQL, nhưng id đã có trong context thì trả lại instance cũ, không ghi đè.",
         [IN("#ca-r3", "right", 0.3), PULSE("#ca-e1", 3.8)]),
        ("Đã đo: transaction khác đổi tên thành Bình và commit, ở đây vẫn thấy An. Muốn mới thì refresh hoặc clear.",
         "Tx khác đổi thành “Binh” và commit, JPQL ở đây vẫn thấy “An”. Muốn mới: refresh() hoặc clear().",
         [IN("#ca-s", "up", 0.4), PULSE("#ca-e2", 3.0), IN("#ca-fix", "left", 5.0)]),
        ("Cache dùng chung giữa các request là second level cache, mặc định tắt.",
         "Cache dùng chung giữa các request: second-level cache, mặc định tắt.",
         [IN("#ca-l2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ dirty checking
    dict(id="dirty", world=(1920, 1080), hud=hud("dt", "Dirty checking", "So với snapshot lúc flush"), cam="".join([
        box("dt-s", 160, 190, 620, 150, "<b>Snapshot lúc load</b><small>name = \"An\"</small>", "violet", "card"),
        box("dt-c", 1140, 190, 620, 150, "<b>Entity hiện tại</b><small>name = \"Binh\"</small>", "cyan", "card"),
        el("dt-cmp", 790, 245, 340, None, "lúc flush: so từng field", "lbl r"),
        el("dt-up", 760, 370, 400, None, "khác → 1 câu UPDATE", "stamp green r"),
        card4("dt-k", 160, 480, 380, 200, 26, [("plug", "Không gọi save", "1 UPDATE"), ("eq", "Giá trị như cũ", "0 UPDATE"),
                                                ("lock", "readOnly = true", "0 UPDATE"), ("split", "Entity detached", "0 UPDATE")]),
        console("dt-con", 160, 720, 1600, ["update product set name=?,stock=?,version=? where id=? and version=?"]),
        chip("dt-dyn", 160, 860, "Chỉ đổi stock vẫn update mọi cột · @DynamicUpdate: chỉ cột thay đổi", "violet"),
        box("dt-trap", 160, 720, 1000, 100, code("order.setTotal(total * 0.9);   // chỉ để hiển thị"), "red", "code"),
        el("dt-ow", 1220, 736, 540, None, "Commit xong: DB bị ghi đè", "stamp red r"),
        chip("dt-tip", 160, 860, "Tính trên DTO · nhiều entity: readOnly, DTO projection, flush + clear theo lô", "green"),
    ]), beats=[
        ("Phần năm: dirty checking. Load entity thì Hibernate chụp snapshot. Lúc flush, field nào khác snapshot thì sinh câu update.",
         "Phần 5: load thì chụp snapshot; lúc flush so từng field, khác thì sinh UPDATE.",
         [IN("#dt-hud", "left", 0.1), IN("#dt-s", "left", 1.8), IN("#dt-c", "right", 4.5), IN("#dt-cmp", "fade", 5.0),
          IN("#dt-up", "stamp", 6.6, 0.45)]),
        ("Đã đo: setter không gọi save, một câu update. Giá trị như cũ, read only, hay entity detached: không câu nào.",
         "Đã đo: setter, không gọi save() → 1 UPDATE. Giá trị như cũ, readOnly, detached → 0 UPDATE.",
         [IN("#dt-k0", "pop", 0.4), IN("#dt-k1", "pop", 3.2), IN("#dt-k2", "pop", 4.4), IN("#dt-k3", "pop", 5.4)]),
        ("Theo mặc định, Hibernate update mọi cột, dù chỉ đổi stock. Dynamic Update thì chỉ update cột thay đổi.",
         "Mặc định UPDATE mọi cột dù chỉ đổi stock. @DynamicUpdate: chỉ update cột thay đổi.",
         [IN("#dt-con", "up", 0.3, 0.4), IN("#dt-con-1", "type1", 0.6, 0.3), IN("#dt-dyn", "left", 2.8)]),
        ("Một cái bẫy: sửa entity chỉ để tính giá hiển thị, như giảm mười phần trăm. Commit xong, database bị ghi đè.",
         "Bẫy: setTotal(total * 0.9) chỉ để hiển thị → commit xong DB bị ghi đè.",
         [OUT("#dt-con, #dt-dyn", "fade", 0.7, 0.4), IN("#dt-trap", "up", 1.1), IN("#dt-ow", "stamp", 5.0, 0.45)]),
        ("Hãy tính trên DTO. Với rất nhiều entity, dùng read only, DTO projection, hoặc flush rồi clear theo lô.",
         "Tính trên DTO. Nhiều entity: readOnly, DTO projection, hoặc flush + clear theo lô.",
         [IN("#dt-tip", "left", 0.3)]),
    ]),
    # ------------------------------------------------------------ flush
    dict(id="flush", world=(1920, 1080), hud=hud("fl", "Flush", "Khi nào SQL thật sự chạy"), cam="".join([
        box("fl-def", 160, 190, 1600, 90, "<b>Flush: gửi SQL xuống DB · chưa phải commit, vẫn rollback được</b>", "violet", "card"),
        row("fl-r1", 310, 'em.persist(new Customer("Flush"))', "0 INSERT", "cyan"),
        row("fl-r2", 400, "JPQL: select count(p) from Product p", "vẫn 0", "cyan"),
        row("fl-r3", 490, "JPQL: select count(c) from Customer c", "1 INSERT", "green"),
        row("fl-r4", 580, "persist thêm 1 · native: select count(*) from customer", "2 INSERT", "amber"),
        chip("fl-when", 160, 690, "FlushMode.AUTO: trước commit · trước query bị ảnh hưởng · khi gọi flush()", "violet"),
        chip("fl-id", 160, 770, "IDENTITY: persist phải INSERT ngay · 1000 persist = 1000 câu INSERT", "amber"),
        box("fl-try", 160, 190, 1000, 170, code("try {\n    repo.save(member);\n} catch (DataIntegrityViolationException e) { ... }"),
            "amber", "code"),
        el("fl-miss", 1220, 240, 540, None, "Thường không bắt được", "stamp red r"),
        chip("fl-saf", 160, 400, "INSERT chạy lúc commit · cần bắt tại chỗ: saveAndFlush(), đừng dùng trong vòng lặp", "green"),
        console("fl-ord", 160, 500, 1600, ["Thứ tự flush: INSERT → UPDATE → collection → DELETE",
                                           'duplicate key value violates unique constraint "member_email_key"']),
        chip("fl-ofix", 160, 690, "remove rồi persist cùng email: gọi flush() ngay sau delete", "green"),
    ]), beats=[
        ("Phần sáu: flush đẩy thay đổi đang chờ xuống database bằng SQL. Nhưng chưa phải commit, vẫn rollback được.",
         "Phần 6: flush đẩy thay đổi xuống DB bằng SQL, nhưng chưa commit, vẫn rollback được.",
         [IN("#fl-hud", "left", 0.1), IN("#fl-def", "up", 2.0)]),
        ("Đã đo: persist xong, chưa có insert. Query bảng khác, vẫn không. Query trên Customer: flush trước, một insert. Native query flush hết: hai.",
         "Đã đo: persist → 0 INSERT; JPQL bảng khác → 0; JPQL trên Customer → 1; native query → 2.",
         [IN("#fl-r1", "left", 0.3), IN("#fl-r2", "left", 2.5), IN("#fl-r3", "left", 4.4), IN("#fl-r4", "left", 7.6)]),
        ("Auto flush chạy trước commit, trước query liên quan, và khi gọi flush. Riêng identity phải insert ngay lúc persist: một nghìn persist, một nghìn insert.",
         "AUTO: trước commit, query liên quan, flush(). IDENTITY: INSERT ngay, 1000 persist = 1000 INSERT.",
         [IN("#fl-when", "left", 0.3), IN("#fl-id", "left", 4.9)]),
        ("Vì thế bọc save trong try catch thường không bắt được lỗi trùng khoá: insert chạy lúc commit. Cần bắt tại chỗ thì save and flush, nhưng không dùng trong vòng lặp.",
         "try/catch quanh save() thường trượt: INSERT lúc commit. Bắt tại chỗ: saveAndFlush, ngoài vòng lặp.",
         [OUT("#fl-def, #fl-r1, #fl-r2, #fl-r3, #fl-r4, #fl-when, #fl-id", "fade", 0, 0.4), IN("#fl-try", "up", 0.4),
          IN("#fl-miss", "stamp", 3.0, 0.45), IN("#fl-saf", "left", 6.5)]),
        ("Thứ tự flush cố định: insert trước, delete sau cùng. Xoá rồi persist lại cùng email thì vẫn lỗi trùng khoá. Hãy gọi flush ngay sau khi xoá.",
         "INSERT → UPDATE → collection → DELETE: xoá rồi persist cùng email lỗi unique. flush() sau xoá.",
         [IN("#fl-ord", "up", 0.3, 0.4), IN("#fl-ord-1", "type1", 0.7, 0.3), IN("#fl-ord-2", "type1", 3.6, 0.3), IN("#fl-ofix", "left", 6.6)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 235, 290, 340, 280, 30, [("grid", "Ba tầng", "Hibernate mới sinh SQL"),
                                                ("split", "Chỉ Managed", "mới có dirty checking"),
                                                ("share", "merge", "dùng bản trả về"),
                                                ("box", "Flush ≠ commit", "SQL chạy trước commit")]),
        chip("ou-next", 700, 650, "Bài tiếp: Lazy Loading & N+1", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: Hibernate mới sinh SQL. Chỉ entity managed được dirty checking. Merge thì dùng bản trả về. Và flush chưa phải là commit.",
         "Hibernate sinh SQL · chỉ Managed có dirty checking · merge: dùng bản trả về · flush ≠ commit.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.6), IN("#ou-c1", "pop", 2.3), IN("#ou-c2", "pop", 5.0), IN("#ou-c3", "pop", 6.9)]),
        ("Bài tiếp: lazy loading, và lỗi N cộng một.", "Bài tiếp: Lazy Loading & N+1.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
