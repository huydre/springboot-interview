"""Lab 2: Stream Queries explainer: scene layouts and per-beat narration + motion.

Outputs from really running labs/java-labs/lab2-stream-queries/StreamQueriesLab.java on JDK 21 (Result: 20/20 passed), study note 11.02:
50 Employee (IT 16, SALES 11, FINANCE 8, MARKETING 8, HR 7); q01 {FINANCE=8, HR=7, IT=16, MARKETING=8, SALES=11}; q03 1539; q04 Nguyen Chi;
q06 [Nguyen Chi=49, Pham Son=47, Nguyen Viet=47]; q07 MARKETING=25.63; q08 47; q09 {false=22, true=28}; q10 {FINANCE=42, HR=29, IT=49, MARKETING=39, SALES=42};
q14 [spring=4, java=3, learn=3]; q15 khanh4@corp.vn,N/A,N/A; q16 SALES=[Tran Hoa, Do Khanh, Tran An] (id 17 and id 50 both 32); q17 {FINANCE=Do Mai, HR=Bui Khanh,
IT=Nguyen Chi, MARKETING=Le Mai, SALES=Tran Hoa}; q18 min=12,max=49; q19 IT; q20 {FINANCE=6, HR=3, IT=8, MARKETING=4, SALES=6}.
Wrong variants also run on JDK 21: toMap(dept, salary) -> IllegalStateException: Duplicate key IT (attempted merging values 44 and 35);
groupingBy without TreeMap::new -> [FINANCE, MARKETING, HR, IT, SALES]; maxBy without collectingAndThen -> {FINANCE=Optional[Employee[id=2, name=Do Mai, ...;
toMap with a null email value -> NullPointerException (2-arg form and merge form).
Theme: mono.
"""
from motion import *  # noqa: F401,F403  (shared helpers from video-kit/)

SCENES = [
    # ------------------------------------------------------------ hook
    dict(id="hook", world=(1920, 1080), hud="", cam="".join([
        el("hk-eye", 310, 170, 1300, None, "Live coding phỏng vấn Backend", "eyebrow r"),
        el("hk-q", 0, 240, 1920, None, letters("20 truy vấn Stream, không có IDE gợi ý"), "h1 center r"),
        console("hk-con", 360, 420, 1200, ["PASS q01 -> {FINANCE=8, HR=7, IT=16, MARKETING=8, SALES=11}", "PASS q10 -> {FINANCE=42, HR=29, IT=49, MARKETING=39, SALES=42}", "Result: 20/20 passed"]),
        tile("hk-tile", 330, 350, 220, "grid"),
        el("hk-word", 600, 380, 1300, None, letters("Lab 2: Stream Queries"), "h1 wordmark r", "text-align:left;white-space:nowrap"),
        el("hk-sub", 0, 680, 1920, None, "đoán · chạy · so sánh", "kin-sub r"),
    ]), beats=[
        ("Phỏng vấn live coding hay hỏi đúng một dạng: gom nhóm, đếm, lấy top, trên một danh sách nhân viên. Bạn viết được bao nhiêu câu mà không có IDE gợi ý?",
         "Live coding hay hỏi gom nhóm, đếm, lấy top trên danh sách nhân viên.",
         [IN("#hk-eye", "blur"), TYPE("#hk-q", 0.3, 0.03)]),
        ("Lab này có hai mươi truy vấn trên năm mươi nhân viên, và một bộ chấm điểm so từng chuỗi output. Đã chạy thật trên JDK hai mươi mốt: hai mươi trên hai mươi đạt.",
         "20 truy vấn, 50 nhân viên, bộ chấm so chuỗi. Chạy thật trên JDK 21: 20/20 passed.",
         [IN("#hk-con", "up", 0.2, 0.4), IN("#hk-con-1", "type1", 0.6, 0.3), IN("#hk-con-2", "type1", 3.0, 0.3), IN("#hk-con-3", "type1", 5.4, 0.3)]),
        ("Hôm nay ta làm Lab hai: Stream Queries. Vòng lặp là đoán kết quả, chạy, rồi so sánh.", "Lab 2: Stream Queries. Vòng lặp: đoán, chạy, so sánh.",
         [OUT("#hk-eye, #hk-q, #hk-con", "blur", 0, 0.45), IN("#hk-tile", "zoomin", 0.3, 0.7), TYPE("#hk-word", 0.6, 0.05), IN("#hk-sub", "blur", 2.0)]),
    ]),
    # ------------------------------------------------------------ setup
    dict(id="setup", world=(1920, 1080), hud=hud("st", "Dữ liệu, bộ chấm điểm, Q01–Q06", "Một file, ba phần"), cam="".join([
        big_title("st", "Dữ liệu và bộ chấm", "Đoán trước, chạy, rồi so từng chuỗi"),
        box("st-code", 160, 190, 1000, 170, code("record Employee(int id, String name, String dept,\n                int salary, int age, String city,\n                String email, List<String> projects) { }"), "cyan", "code"),
        box("st-data", 1240, 190, 520, 170, "<b>50 nhân viên</b><br>IT 16 · SALES 11 · FINANCE 8<br>MARKETING 8 · HR 7", "violet", "card"),
        gnode("st-l1", 160, 410, 380, 100, "1. Đoán kết quả", "amber"), gnode("st-l2", 700, 410, 380, 100, "2. Chạy bộ chấm", "cyan"), gnode("st-l3", 1240, 410, 380, 100, "3. So chuỗi", "green"),
        console("st-con", 160, 570, 1600, ["PASS q01 -> {FINANCE=8, HR=7, IT=16, MARKETING=8, SALES=11}", "PASS q03 -> 1539", "PASS q04 -> Nguyen Chi", "PASS q06 -> [Nguyen Chi=49, Pham Son=47, Nguyen Viet=47]"]),
        chip("st-c1", 160, 895, "Luật: viết ít nhất 5 câu trong trình soạn thảo không autocomplete", "amber"),
        chip("st-c2", 160, 825, "reversed() đặt trước thenComparingInt chỉ đảo phần lương: hoà lương thì id tăng dần", "green"),
        wires(trace("st-a", [(540, 460), (692, 460)], "cyan"), trace("st-b", [(1080, 460), (1232, 460)], "cyan")),
    ]), beats=[
        ("Phần một: dữ liệu và bộ chấm điểm. Cả lab nằm trong một file Java. Có một record Employee, năm mươi dòng dữ liệu, hai mươi method, và bộ chấm điểm.",
         "Phần 1: một file gồm record Employee, 50 dòng dữ liệu, 20 method và bộ chấm.",
         [TYPE("#st-big", 0.1, 0.06), IN("#st-bsub", "blur", 0.8), OUT("#st-big, #st-bsub", "zoom", 3.4), IN("#st-hud", "left", 4.0),
          IN("#st-code", "up", 4.4, 0.5), IN("#st-data", "pop", 7.4)]),
        ("Email có thể null, danh sách project có thể rỗng. Bộ chấm so chuỗi kết quả với chuỗi mong đợi. Câu nào ném exception thì vẫn chấm tiếp.",
         "Email có thể null, projects có thể rỗng. Bộ chấm so chuỗi, exception vẫn chấm tiếp.",
         [IN("#st-l1", "pop", 4.6), DRAW("#st-a-p", 5.2, 0.4), IN("#st-l2", "pop", 5.6), DRAW("#st-b-p", 6.4, 0.4), IN("#st-l3", "pop", 6.8)]),
        ("Với mỗi câu, cứ đoán output trước, rồi mới chạy. Câu một đến sáu là mức dễ. Đếm theo phòng, tổng lương một nghìn năm trăm ba chín, người lương cao nhất là Nguyen Chi.",
         "Q01–Q06: đếm theo phòng, tổng lương 1539, người lương cao nhất Nguyen Chi.",
         [IN("#st-con", "up", 3.6, 0.4), IN("#st-con-1", "type1", 4.0, 0.3), IN("#st-con-2", "type1", 6.0, 0.3), IN("#st-con-3", "type1", 8.0, 0.3)]),
        ("Top ba lương có hai người cùng bốn mươi bảy triệu, nên phải có tiêu chí phụ theo id. Chú ý: reversed đặt trước then comparing chỉ đảo phần lương.",
         "Top 3 lương: hoà 47 thì id nhỏ trước. reversed() chỉ đảo phần lương.",
         [IN("#st-con-4", "type1", 0.4, 0.3), IN("#st-c2", "left", 5.4)]),
        ("Luật của lab: viết ít nhất năm câu trong trình soạn thảo không autocomplete, để nhớ tên các collector khi live coding.",
         "Luật: ít nhất 5 câu không autocomplete để nhớ tên collector.", [IN("#st-c1", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ medium
    dict(id="medium", world=(1920, 1080), hud=hud("md", "Mức trung bình, Q07–Q15", "Hai bẫy đã chạy thật"), cam="".join([
        big_title("md", "Hai cái bẫy", "toMap trùng key và thứ tự của Map"),
        box("md-code", 160, 190, 1600, 90, code(".collect(toMap(Employee::dept, Employee::salary))   // đoán: phòng → lương cao nhất?"), "amber", "code"),
        console("md-a", 160, 310, 1600, ["IllegalStateException: Duplicate key IT (attempted merging values 44 and 35)", "Sửa: toMap(dept, salary, Math::max, TreeMap::new)", "PASS q10 -> {FINANCE=42, HR=29, IT=49, MARKETING=39, SALES=42}"]),
        console("md-b", 160, 540, 1600, ["groupingBy không có TreeMap::new → [FINANCE, MARKETING, HR, IT, SALES]", "FAIL dù số đúng: bộ chấm so chuỗi, HashMap in theo hash", "PASS q07 -> {FINANCE=30.88, HR=22.57, IT=38.31, MARKETING=25.63, SALES=28.73}"]),
        chip("md-c1", 160, 745, "Q08 distinct() trước skip(1) → 47 · Q09 {false=22, true=28} · Q14 [spring=4, java=3, learn=3]", "cyan"),
        chip("md-c2", 160, 810, "Q15 email null → Optional rỗng, không NPE: khanh4@corp.vn,N/A,N/A", "green"),
        chip("md-c3", 160, 875, "toMap gặp value null: NullPointerException, cả bản 2 tham số lẫn bản có merge", "red"),
    ]), beats=[
        ("Phần hai: mức trung bình, câu bảy đến mười lăm. Mình chỉ lấy hai cái bẫy đã chạy thật.",
         "Phần 2: Q07–Q15, hai cái bẫy đã chạy thật.",
         [TYPE("#md-big", 0.1, 0.06), IN("#md-bsub", "blur", 0.8), OUT("#md-big, #md-bsub", "zoom", 3.0), IN("#md-hud", "left", 3.6)]),
        ("Câu mười: phòng và lương cao nhất, viết bằng to map hai tham số. Bạn đoán là chạy ngon chứ gì. Chạy thật thì ném Illegal State Exception: trùng key IT, đang gộp bốn mươi bốn và ba mươi lăm.",
         "Đoán: chạy ngon. Chạy thật: Duplicate key IT (44 và 35).",
         [IN("#md-code", "up", 3.8, 0.5), IN("#md-a", "up", 8.0, 0.4), IN("#md-a-1", "type1", 8.4, 0.3)]),
        ("Cách sửa là thêm tham số thứ ba, hàm merge Math max, và tham số thứ tư là map có thứ tự. Lúc này mới đạt, ra đúng bốn mươi chín cho IT.",
         "Thêm merge Math::max và map factory TreeMap::new → PASS q10.",
         [IN("#md-a-2", "type1", 0.4, 0.3), IN("#md-a-3", "type1", 5.4, 0.3)]),
        ("Bẫy thứ hai: group by mà thiếu map có thứ tự, key ra theo hash. Số đúng hết nhưng chuỗi khác nên bộ chấm báo FAIL. Thêm Tree Map thì ra đúng, Marketing hai mươi lăm phẩy sáu ba.",
         "groupingBy thiếu TreeMap::new: key theo hash, FAIL dù số đúng. Có TreeMap → PASS.",
         [IN("#md-b", "up", 0.3, 0.4), IN("#md-b-1", "type1", 0.6, 0.3), IN("#md-b-2", "type1", 4.4, 0.3), IN("#md-b-3", "type1", 8.0, 0.3)]),
        ("Vài điểm nữa. Lương cao thứ hai phải distinct, ra bốn mươi bảy. Email null qua Optional map cho ra rỗng chứ không lỗi. Còn to map gặp value null thì ném Null Pointer Exception.",
         "Q08 distinct → 47. Optional.map với email null không NPE. toMap value null → NPE.",
         [IN("#md-c1", "left", 0.4), IN("#md-c2", "left", 4.8), IN("#md-c3", "left", 9.0)]),
    ]),
    # ------------------------------------------------------------ hard
    dict(id="hard", world=(1920, 1080), hud=hud("hd", "Mức khó, Q16–Q20", "Đoán lỗi trước khi chạy"), cam="".join([
        big_title("hd", "Mức khó", "Top N mỗi nhóm, teeing, so với trung bình"),
        console("hd-a", 160, 190, 1600, ["SALES lương 32 triệu: id 17 Tran An, id 50 Do Ngoc", "Q16 SALES=[Tran Hoa, Do Khanh, Tran An]   ← tiêu chí phụ theo id quyết định"]),
        console("hd-b", 160, 360, 1600, ["Quên collectingAndThen: {FINANCE=Optional[Employee[id=2, name=Do Mai, ...", "Q17 {FINANCE=Do Mai, HR=Bui Khanh, IT=Nguyen Chi, MARKETING=Le Mai, SALES=Tran Hoa}"]),
        console("hd-c", 160, 530, 1600, ["Q18 teeing(minBy, maxBy) → min=12,max=49", "Q19 phòng trung bình cao nhất → IT", "Q20 {FINANCE=6, HR=3, IT=8, MARKETING=4, SALES=6}"]),
        chip("hd-n1", 160, 780, "Q20 cần 2 lần duyệt: lần 1 tính trung bình mỗi phòng, lần 2 lọc lương cao hơn", "violet"),
        chip("hd-n2", 160, 860, "Phỏng vấn: lương cao thứ 2 · bẫy toMap · top N mỗi nhóm · groupingBy với maxBy", "amber"),
    ]), beats=[
        ("Phần ba: mức khó, câu mười sáu đến hai mươi. Trước khi chạy, hãy đoán lỗi hay gặp.",
         "Phần 3: Q16–Q20. Đoán lỗi hay gặp trước khi chạy.",
         [TYPE("#hd-big", 0.1, 0.06), IN("#hd-bsub", "blur", 0.8), OUT("#hd-big, #hd-bsub", "zoom", 3.4), IN("#hd-hud", "left", 4.0)]),
        ("Câu mười sáu, top ba lương mỗi phòng, bằng Grouping By với Collecting And Then. Ở Sales, Tran An và Do Ngoc cùng ba mươi hai triệu. Tiêu chí phụ theo id quyết định ai vào top ba.",
         "Q16: top 3 mỗi phòng. SALES hoà 32 triệu: id quyết định.",
         [IN("#hd-a", "up", 4.8, 0.4), IN("#hd-a-1", "type1", 5.2, 0.3), IN("#hd-a-2", "type1", 9.0, 0.3)]),
        ("Câu mười bảy, người lương cao nhất mỗi phòng. Quên Collecting And Then thì giá trị là Optional, in ra cả cái Optional Employee. Bọc lại thì ra đúng tên.",
         "Q17: maxBy trả Optional. Bọc collectingAndThen để ra tên.",
         [IN("#hd-b", "up", 0.3, 0.4), IN("#hd-b-1", "type1", 0.6, 0.3), IN("#hd-b-2", "type1", 5.6, 0.3)]),
        ("Câu mười tám, Teeing lấy cả nhỏ nhất và lớn nhất trong một lần duyệt: mười hai và bốn mươi chín. Phòng trung bình cao nhất là IT.",
         "Q18 teeing một lần duyệt: min=12, max=49. Q19: IT.",
         [IN("#hd-c", "up", 0.3, 0.4), IN("#hd-c-1", "type1", 0.6, 0.3), IN("#hd-c-2", "type1", 6.0, 0.3)]),
        ("Câu hai mươi, đếm người cao hơn trung bình phòng mình, cần hai lần duyệt. Lần một tính trung bình, lần hai mới lọc.",
         "Q20 cần 2 lần duyệt: tính trung bình, rồi lọc.",
         [IN("#hd-c-3", "type1", 0.4, 0.3), IN("#hd-n1", "left", 3.2)]),
        ("Bốn câu phỏng vấn hay hỏi: lương cao thứ hai, bẫy khi gom thành Map, lấy phần tử đứng đầu mỗi nhóm, và Grouping By với max By trả về gì.",
         "4 câu phỏng vấn: lương thứ 2, bẫy toMap, top mỗi nhóm, groupingBy + maxBy.", [IN("#hd-n2", "left", 0.4)]),
    ]),
    # ------------------------------------------------------------ checklist
    dict(id="checklist", world=(1920, 1080), hud=hud("ck", "Checklist hoàn thành", "Lời giải trong labs/java-labs"), cam="".join([
        el("ck-h", 0, 150, 1920, None, letters("Xong lab khi"), "h1 center r"),
        card4("ck-c", 160, 300, 380, 300, 30, [("grid", "20/20 passed", "chạy java StreamQueriesLab.java"),
                                               ("quote", "5 câu không IDE", "Q07, Q08, Q10, Q14, Q16"),
                                               ("split", "Viết lại Q16, Q20", "5 phút, không nhìn lời giải"),
                                               ("shield", "4 câu phỏng vấn", "trả lời không cần đọc")]),
        el("ck-note", 160, 700, 1600, None, "Lời giải ở labs/java-labs/lab2-stream-queries/", "note left r"),
    ]), beats=[
        ("Phần bốn: checklist. Xong lab khi chạy ra hai mươi trên hai mươi đạt, và đã viết ít nhất năm câu không có IDE gợi ý.",
         "Phần 4: 20/20 passed và ít nhất 5 câu viết không có IDE.",
         [TYPE("#ck-h", 0, 0.05), IN("#ck-c0", "pop", 2.0), IN("#ck-c1", "pop", 5.6)]),
        ("Rồi viết lại câu mười sáu và câu hai mươi lần thứ hai, trong năm phút, không nhìn lời giải. Lời giải nằm trong thư mục labs.",
         "Viết lại Q16 và Q20 trong 5 phút, không nhìn lời giải.",
         [IN("#ck-c2", "pop", 0.6), IN("#ck-c3", "pop", 4.6), IN("#ck-note", "up", 6.0)]),
    ]),
    # ------------------------------------------------------------ outro
    dict(id="outro", world=(1920, 1080), hud="", cam="".join([
        el("ou-h", 0, 140, 1920, None, letters("Tóm tắt trong 4 dòng"), "h1 center r"),
        card4("ou-c", 230, 290, 340, 280, 30, [("eq", "Đoán rồi chạy", "so từng chuỗi output"),
                                                ("hash", "toMap", "trùng key phải có merge"),
                                                ("tree", "Map có thứ tự", "TreeMap::new cho bộ chấm"),
                                                ("box", "Top N mỗi nhóm", "luôn có tiêu chí phụ")]),
        chip("ou-next", 700, 650, "Bài tiếp: Lab 3 Concurrency", "violet"),
        el("ou-cta", 0, 780, 1920, None, "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ", "cta r"),
    ]), beats=[
        ("Tóm lại: đoán rồi chạy, so từng chuỗi output. To map trùng key thì phải có hàm merge. Map cần thứ tự cố định thì dùng map có thứ tự. Và top N mỗi nhóm luôn có tiêu chí phụ khi hoà.",
         "Đoán rồi chạy · toMap cần merge · Map có thứ tự cố định · top N có tiêu chí phụ.",
         [TYPE("#ou-h", 0, 0.03), IN("#ou-c0", "pop", 0.8), IN("#ou-c1", "pop", 3.6), IN("#ou-c2", "pop", 6.8), IN("#ou-c3", "pop", 10.6)]),
        ("Bài tiếp: bài thực hành ba, Concurrency.", "Bài tiếp: Lab 3 Concurrency.", [IN("#ou-next", "pop", 0.3)]),
        ("Mở bài học tương tác để làm quiz, và tự tay thử từng ví dụ nhé.",
         "Mở bài học tương tác để làm quiz và tự tay thử từng ví dụ nhé.",
         [IN("#ou-cta", "blur", 0.2), PULSE("#ou-next", 1.4)]),
    ]),
]

fit_to_audio(SCENES, __file__)
