import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (TimeDemo.java: Instant across zones, New York DST 2026-03-08 and 2026-11-01, shared SimpleDateFormat vs DateTimeFormatter on 8 threads).
export const javaTime: Lesson = {
  slug: "java-time",
  crumb: "Date-Time API",
  videoDir: "/videos/java-time",
  videoVersion: "0",
  scenes: [],
  title: "Date-Time API: giờ, múi giờ và các bẫy",
  subtitle:
    "Instant, LocalDateTime, ZonedDateTime, Duration, Period. Vì sao một ngày không phải lúc nào cũng 24 giờ, giờ có thể không tồn tại hay xuất hiện hai lần, và cách lưu thời gian đúng.",
  openingQuiz: {
    question: "Hệ thống có khách ở nhiều quốc gia. Nên lưu thời điểm tạo đơn hàng bằng kiểu nào?",
    options: ["`LocalDateTime.now()`", "`Instant` (UTC)", "`String` theo giờ máy chủ", "`int` số giờ"],
    answer: 1,
    explain: "`Instant` là một thời điểm duy nhất trên trục thời gian, không phụ thuộc múi giờ của máy. Đổi sang múi giờ của người dùng khi hiển thị.",
  },
  roadmap: [
    "Chặng 1: chọn đúng kiểu, `Instant` hay `LocalDateTime` hay `ZonedDateTime`.",
    "Chặng 2: đổi giờ mùa hè (DST): `Duration` khác `Period`, giờ không tồn tại và giờ trùng.",
    "Chặng 3: `SimpleDateFormat` không an toàn thread, cách lưu, truyền thời gian đúng, và inject `Clock` để test.",
  ],
  sections: [
    {
      id: "types",
      title: "Instant, LocalDateTime, ZonedDateTime: chọn kiểu nào",
      intro: [
        "Trước hết, **UTC** là giờ chuẩn quốc tế, mốc chung mà mọi múi giờ tính độ lệch so với nó: Việt Nam là UTC+7, New York mùa đông là UTC-5. `Instant` là **một thời điểm trên trục thời gian**, luôn tính theo UTC. `LocalDateTime` chỉ là ngày giờ ghi trên đồng hồ, **không biết múi giờ**. `ZonedDateTime` là ngày giờ kèm múi giờ.",
        "Lưu và truyền thời điểm thì dùng `Instant`. Hiển thị cho người dùng thì đổi sang múi giờ của họ.",
      ],
      widgetTitle: "Cùng một thời điểm, hai múi giờ",
      compare: [
        way(
          "LocalDateTime để lưu thời điểm",
          `LocalDateTime t = LocalDateTime.now();        // phụ thuộc múi giờ của máy đang chạy
save(t);`,
          [
            ask("Hai server cùng gọi now() cùng một lúc", bad("Server ở Việt Nam ghi `14:00`, server ở New York ghi `02:00`, cho cùng một sự kiện. Đã chạy: thời điểm `2026-02-10T07:00:00Z` đổi ra giờ đồng hồ là `2026-02-10T14:00` ở Việt Nam (UTC+7) và `2026-02-10T02:00` ở New York (UTC-5). Lưu xuống chỉ còn hai con số trần, không biết cái nào sớm hơn.")),
            ask("Đổi sang Instant", bad("`LocalDateTime` không đổi sang `Instant` được nếu không biết múi giờ.")),
          ],
          "Ngày giờ trần không nói rõ nó là thời điểm nào.",
        ),
        way(
          "Instant",
          `Instant t = Instant.now();                  // một thời điểm, không phụ thuộc máy
t.atZone(ZoneId.of("Asia/Ho_Chi_Minh"))     // chỉ đổi múi giờ khi HIỂN THỊ`,
          [
            ask("Hai server cùng gọi now() cùng một lúc", ok("Cả hai lưu cùng một giá trị, ví dụ `2026-02-10T07:00:00Z`, vì `Instant` không phụ thuộc múi giờ của máy.")),
            ask("Hiển thị cho người dùng", ok("`atZone(...)` đổi lúc hiển thị. Đã chạy: `2026-02-10T14:00+07:00[Asia/Ho_Chi_Minh]` cho người ở Việt Nam, `2026-02-10T02:00-05:00[America/New_York]` cho người ở New York.")),
          ],
          "Lưu một thời điểm duy nhất, đổi múi giờ ở lớp hiển thị.",
        ),
      ],
      after: [
        "`LocalDate` dành cho ngày không cần giờ (sinh nhật, hạn thanh toán). `OffsetDateTime` là ngày giờ kèm độ lệch cố định như `+07:00`, hay dùng khi lưu database vì nó khớp với kiểu cột `TIMESTAMP WITH TIME ZONE` của SQL: cột lưu được một độ lệch, chứ không lưu được cả bộ luật đổi giờ của một vùng như `America/New_York`.",
      ],
      trap: {
        title: "LocalDateTime.now() trên server",
        text: "Kết quả phụ thuộc múi giờ của máy chạy. Hai server ở hai múi giờ ghi hai giá trị khác nhau cho cùng một sự kiện.",
      },
      quiz: {
        question: "`LocalDateTime` khác `Instant` ở điểm nào?",
        options: [
          "`LocalDateTime` không có múi giờ nên không xác định được một thời điểm cụ thể",
          "`LocalDateTime` chính xác hơn",
          "`Instant` chỉ lưu được ngày",
          "Không khác nhau",
        ],
        answer: 0,
        explain: "`LocalDateTime` chỉ là số trên đồng hồ. Cần kèm múi giờ mới biết nó là thời điểm nào.",
      },
    },
    {
      id: "dst",
      title: "Duration và Period: một ngày không phải lúc nào cũng 24 giờ",
      intro: [
        "`Duration` đo bằng **giờ, phút, giây**: thời gian trôi qua thật, như đồng hồ bấm giờ. `Period` đo bằng **ngày, tháng, năm** theo lịch. Chúng khác nhau khi qua ngày đổi giờ mùa hè ({{dst}}).",
        "Ngày 8/3/2026 New York chuyển sang giờ mùa hè: 02:00 nhảy thẳng lên 03:00, nên ngày đó chỉ có 23 giờ.",
        "Hai đoạn code bên dưới cùng bắt đầu từ `ZonedDateTime start = ZonedDateTime.of(2026, 3, 7, 12, 0, 0, 0, ZoneId.of(\"America/New_York\"));`, tức 12:00 trưa ngày 7/3 ở New York. Phải là `ZonedDateTime` thì mới thấy lệch: `LocalDateTime` không biết múi giờ nên cộng 24 giờ vẫn ra đúng 12:00 hôm sau (đã chạy: `2026-03-08T12:00`).",
      ],
      widgetTitle: "Hẹn 12:00 mỗi ngày ở New York",
      compare: [
        way(
          "Cộng 24 giờ",
          `start.plus(Duration.ofHours(24))`,
          [
            ask("Hẹn 12:00 mỗi ngày", bad("Đã chạy: từ `2026-03-07T12:00` cộng 24 giờ ra `2026-03-08T13:00`, lệch một giờ so với đồng hồ.")),
          ],
          "24 giờ là thời gian trôi qua thật, không phải \"cùng giờ ngày mai\".",
        ),
        way(
          "Cộng 1 ngày",
          `start.plusDays(1)`,
          [
            ask("Hẹn 12:00 mỗi ngày", ok("Đã chạy: ra `2026-03-08T12:00`, giữ đúng giờ trên đồng hồ.")),
            ask("Hai mốc cách nhau bao lâu", ok("Đã chạy: `Duration.between` ra `PT23H`, còn `Period.between` hai ngày ra `P1D`. Một ngày lịch dài 23 giờ hôm đó.")),
          ],
          "Cộng theo lịch thì dùng `plusDays`, `plusMonths`. Đo thời gian trôi qua thì dùng `Duration`.",
        ),
      ],
      after: [
        "Tương tự với tháng: `LocalDate.of(2026, 1, 31).plusMonths(1)` ra `2026-02-28`, tự co về ngày cuối tháng chứ không báo lỗi.",
      ],
      trap: {
        title: "Dùng Duration để cộng ngày",
        text: "Cộng `Duration.ofHours(24)` thay cho `plusDays(1)` sẽ lệch một giờ mỗi lần đi qua đổi giờ. Việc \"lặp lại mỗi ngày\" luôn là phép tính lịch.",
      },
      quiz: {
        question: "Ngày chuyển sang giờ mùa hè ở New York, `Duration.between(12:00 hôm trước, 12:00 hôm sau)` bằng bao nhiêu?",
        options: ["24 giờ", "23 giờ", "25 giờ", "22 giờ"],
        answer: 1,
        explain: "Đã chạy: `PT23H`. Đồng hồ nhảy tiến một giờ nên ngày đó chỉ có 23 giờ.",
      },
    },
    {
      id: "gap",
      title: "Giờ không tồn tại và giờ xuất hiện hai lần",
      intro: [
        "Khi đồng hồ nhảy **tiến**, có giờ **không tồn tại** (gap). Khi nhảy **lùi**, có giờ **xuất hiện hai lần** (overlap). `ZonedDateTime` xử lý theo quy tắc mặc định, bạn nên biết quy tắc đó.",
        "Ở New York năm 2026: ngày 8/3, đồng hồ nhảy từ 02:00 lên 03:00, nên mọi giờ từ 02:00 tới 02:59 **không tồn tại**. Ngày 1/11, đồng hồ lùi từ 02:00 về 01:00, nên mọi giờ từ 01:00 tới 01:59 **xuất hiện hai lần** (lần đầu theo giờ mùa hè `-04:00`, lần sau theo giờ mùa đông `-05:00`). Đã chạy: `getTransition` báo `Gap at 2026-03-08T02:00-05:00 to -04:00` và `Overlap at 2026-11-01T02:00-04:00 to -05:00`.",
      ],
      widgetTitle: "02:30 ngày 8/3 và 01:30 ngày 1/11 ở New York",
      compare: [
        way(
          "Giả định mọi giờ đều có đúng một lần",
          `scheduleAt(LocalDateTime.of(2026, 3, 8, 2, 30));   // 02:30 này có tồn tại không?`,
          [
            ask("Hẹn 02:30 ngày 8/3", bad("Giờ này không tồn tại ở New York. Không kiểm tra thì việc bị chạy sai giờ hoặc bị bỏ qua.")),
            ask("Hẹn 01:30 ngày 1/11", bad("Giờ này xuất hiện hai lần, không rõ là lần nào.")),
          ],
          "Ngày giờ trần không đủ để biết thời điểm thật.",
        ),
        way(
          "ZonedDateTime và quy tắc đã biết",
          `ZonedDateTime.of(localDateTime, zone)   // gap: đẩy tới. Overlap: mặc định lấy lần đầu
zdt.withLaterOffsetAtOverlap()           // chọn lần thứ hai`,
          [
            ask("Hẹn 02:30 ngày 8/3", ok("Đã chạy: được đẩy thành `03:30-04:00`.")),
            ask("Hẹn 01:30 ngày 1/11", ok("Đã chạy: mặc định là lần đầu `-04:00`. `withLaterOffsetAtOverlap()` chọn lần sau `-05:00`.")),
          ],
          "Quy tắc xác định, nhưng người viết phải biết để chọn cho đúng.",
        ),
      ],
      after: [
        "Lưu và so sánh thời điểm bằng `Instant` (UTC), chỉ dùng `ZonedDateTime` để hiển thị. Việt Nam không có DST nên ít gặp, nhưng hệ thống có khách ở Mỹ hay châu Âu thì gặp thật.",
        "Với lịch chạy định kỳ thì phải chọn. Lịch theo UTC không bao giờ bị bỏ hay chạy trùng, nhưng một việc nghiệp vụ \"02:30 sáng giờ New York\" sẽ lệch một giờ so với giờ địa phương mỗi khi qua đổi giờ. Nếu việc đó thật sự gắn với giờ địa phương thì khai báo rõ múi giờ cho lịch, ví dụ Spring `@Scheduled(cron = \"0 30 2 * * *\", zone = \"America/New_York\")`, và tránh đặt giờ chạy rơi vào 01:00 tới 02:59.",
      ],
      trap: {
        title: "Lịch chạy theo giờ địa phương",
        text: "Ở New York, việc \"chạy 02:30 mỗi ngày\" rơi vào gap ngày 8/3 nên có thể bị bỏ qua hôm đó. Việc \"chạy 01:30 mỗi ngày\" rơi vào overlap ngày 1/11, khi 01:30 xuất hiện hai lần, nên có thể chạy hai lần. Lịch hệ thống dùng UTC; lịch gắn với giờ địa phương thì khai báo múi giờ và tránh khung 01:00 tới 02:59.",
      },
      quiz: {
        question: "Giờ `02:30` ngày 8/3/2026 ở New York (nhảy tiến). `ZonedDateTime.of(...)` ra gì?",
        options: ["Ném exception", "`03:30-04:00`", "`01:30`", "`02:30-05:00`"],
        answer: 1,
        explain: "Đã chạy: giờ không tồn tại được đẩy tiến thành `03:30-04:00`.",
      },
    },
    {
      id: "formatter",
      title: "SimpleDateFormat không an toàn thread",
      intro: [
        "`SimpleDateFormat` giữ **trạng thái bên trong**: nó có một field `Calendar` dùng làm chỗ nháp, mỗi lần `parse` hay `format` đều xoá rồi ghi lại field đó. Dùng chung một instance giữa nhiều thread (ví dụ `static final`) cho kết quả sai hoặc ném lỗi. `DateTimeFormatter` thì **bất biến** nên dùng chung thoải mái.",
      ],
      widgetTitle: "8 thread cùng parse 3000 lần",
      compare: [
        way(
          "SimpleDateFormat dùng chung",
          `static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd");   // dùng chung nhiều thread
Date d = SDF.parse(text);`,
          [
            ask("8 thread cùng parse 3000 lần", bad("Đã chạy: có kết quả sai hoặc exception.")),
            ask("Chữa bằng synchronized", bad("Đúng nhưng các thread phải xếp hàng chờ nhau.")),
          ],
          "Trạng thái bên trong bị nhiều thread ghi đè lẫn nhau.",
        ),
        way(
          "DateTimeFormatter",
          `static final DateTimeFormatter F = DateTimeFormatter.ofPattern("yyyy-MM-dd");
LocalDate d = LocalDate.parse(text, F);`,
          [
            ask("8 thread cùng parse 3000 lần", ok("Đã chạy: **0** kết quả sai.")),
            ask("Vì sao an toàn", ok("Bất biến: không có trạng thái thay đổi để tranh nhau.")),
          ],
          "Bất biến thì an toàn thread mà không cần khoá.",
        ),
      ],
      after: [
        "`Date`, `Calendar` và `SimpleDateFormat` là API cũ. Từ Java 8, code mới hãy dùng `java.time`.",
      ],
      trap: {
        title: "ThreadLocal<SimpleDateFormat>",
        text: "Cách chữa hay gặp ở code cũ, chạy được. Với code mới chỉ cần đổi sang `DateTimeFormatter`, không phải lo gì về thread.",
      },
      quiz: {
        question: "Vì sao `DateTimeFormatter` dùng chung giữa nhiều thread được?",
        options: ["Vì nó bất biến", "Vì nó dùng `synchronized`", "Vì nó chạy nhanh", "Vì nó dùng `volatile`"],
        answer: 0,
        explain: "Không có trạng thái thay đổi nên không có gì để tranh nhau giữa các thread.",
      },
    },
    {
      id: "store",
      title: "Lưu và truyền: UTC và ISO-8601",
      intro: [
        "Quy tắc dễ nhớ: **lưu và truyền bằng UTC**, đổi múi giờ lúc hiển thị. Trong JSON dùng chuỗi ISO-8601 có `Z` hoặc độ lệch, ví dụ `2026-03-08T10:00:00Z`.",
      ],
      widgetTitle: "Truyền thời gian qua API",
      compare: [
        way(
          "Chuỗi không có múi giờ",
          `"2026-03-08T10:00:00"      // 10 giờ ở đâu?`,
          [
            ask("Parse thành Instant", bad("Đã chạy: `Instant.parse` ném `DateTimeParseException` vì thiếu múi giờ.")),
            ask("Mỗi nơi hiểu một kiểu", bad("Server hiểu theo giờ máy, client hiểu theo giờ của họ.")),
          ],
          "Thiếu múi giờ nên thời điểm không xác định.",
        ),
        way(
          "ISO-8601 có Z",
          `Instant.parse("2026-03-08T10:00:00Z")
// giờ người dùng nhập, đổi sang UTC:
LocalDateTime.parse("2026-03-08T17:00:00").atZone(vn).toInstant()`,
          [
            ask("Parse thành Instant", ok("Đã chạy: ra `2026-03-08T10:00:00Z`, không mơ hồ.")),
            ask("Giờ người dùng nhập trên form", ok("Đã chạy: `17:00` ở Việt Nam đổi ra `2026-03-08T10:00:00Z` (UTC+7).")),
          ],
          "Mỗi thời điểm có đúng một cách hiểu, ở bất kỳ nơi nào.",
        ),
      ],
      after: [
        "Trong JPA/Hibernate 6: dùng `Instant` hoặc `OffsetDateTime` cho cột thời điểm, và `LocalDate` cho ngày không giờ.",
      ],
      trap: {
        title: "Cột TIMESTAMP không có múi giờ",
        text: "Cột `TIMESTAMP` (không kèm múi giờ) chỉ lưu ngày giờ trần. Khi ghi một `Instant` vào cột này, JDBC đổi nó sang múi giờ mặc định của JVM; hai server đặt múi giờ khác nhau sẽ ghi và đọc lệch nhau vài giờ. Cách tránh: đặt `spring.jpa.properties.hibernate.jdbc.time_zone=UTC`, hoặc dùng cột `TIMESTAMP WITH TIME ZONE`.",
      },
      quiz: {
        question: "Người dùng ở Việt Nam nhập giờ hẹn `17:00`. Cách lưu đúng nhất là gì?",
        options: [
          "Lưu chuỗi `17:00`",
          "Đổi sang `Instant` bằng múi giờ của người dùng, rồi lưu UTC",
          "Lưu `LocalDateTime` theo giờ server",
          "Lưu số giây của ngày",
        ],
        answer: 1,
        explain: "`atZone(vn).toInstant()` cho ra thời điểm tuyệt đối `10:00Z`, đọc ở đâu cũng đúng.",
      },
    },
    {
      id: "clock",
      title: "Inject Clock để test được code có thời gian",
      intro: [
        "Code gọi thẳng `Instant.now()` rất khó test: muốn kiểm tra \"hết hạn sau 1 giây nữa\" thì test phải chờ thật, hoặc chạy lúc nào ra kết quả lúc đó.",
        "`java.time.Clock` là nguồn thời gian có thể thay thế. Mọi method `now()` đều có bản nhận `Clock`: `Instant.now(clock)`, `LocalDate.now(clock)`. Code thật nhận `Clock.systemUTC()`; test truyền `Clock.fixed(...)` để đóng băng thời gian ở đúng thời điểm mình muốn.",
        "Ví dụ `Subscription` nhận `Clock` qua constructor, có `isExpired()` trả `Instant.now(clock).isAfter(expiresAt)` với `expiresAt = 2026-03-01T00:00:00Z`. Test với `Clock fixed = Clock.fixed(Instant.parse(\"2026-02-28T23:59:59Z\"), ZoneOffset.UTC)` thì `isExpired()` là false; với `Clock.offset(fixed, Duration.ofSeconds(2))` (2 giây sau) thì là true. Đã chạy đúng như vậy, không phải chờ.",
      ],
      after: [
        "Trong Spring, khai báo một bean `@Bean Clock clock() { return Clock.systemUTC(); }` rồi inject vào service. Test chỉ cần thay bean này bằng một `Clock.fixed(...)`.",
      ],
      quiz: {
        question: "Vì sao nên inject `Clock` thay vì gọi `Instant.now()` trực tiếp?",
        options: [
          "Vì `Instant.now()` chậm",
          "Để test thay được nguồn thời gian bằng `Clock.fixed(...)`, kiểm tra mọi mốc giờ mà không phải chờ",
          "Vì `Instant.now()` không an toàn thread",
          "Vì Clock chính xác hơn tới nano giây",
        ],
        answer: 1,
        explain: "Clock là dependency như mọi dependency khác: code thật dùng đồng hồ hệ thống, test dùng đồng hồ đóng băng để kết quả lần nào cũng giống nhau.",
      },
    },
    {
      id: "chon-kieu",
      title: "Bài tập: dùng kiểu nào?",
      intro: ["Mỗi dòng là một tình huống. Chọn kiểu phù hợp."],
      widgetTitle: "Chọn kiểu thời gian",
      drill: {
        choices: ["Instant", "LocalDate", "LocalDateTime", "ZonedDateTime", "Duration", "Period"],
        summary: "Hỏi: có cần biết thời điểm tuyệt đối không, có cần giờ không, có cần múi giờ không, hay là một khoảng.",
        items: [
          { q: "Lưu thời điểm đơn hàng được tạo vào database.", a: "Instant", why: "Một thời điểm tuyệt đối, không phụ thuộc múi giờ." },
          { q: "Ngày sinh của khách hàng.", a: "LocalDate", why: "Chỉ cần ngày, không có giờ và múi giờ." },
          { q: "Hiển thị giờ cuộc họp theo múi giờ của từng người tham dự.", a: "ZonedDateTime", why: "Ngày giờ kèm múi giờ để hiển thị." },
          { q: "Một request xử lý hết bao lâu.", a: "Duration", why: "Khoảng thời gian đo bằng giờ, phút, giây." },
          { q: "Hạn thanh toán là 3 tháng kể từ ngày ký.", a: "Period", why: "Khoảng theo lịch (ngày, tháng, năm)." },
          { q: "Người dùng nhập giờ hẹn trên form, chưa gắn múi giờ.", a: "LocalDateTime", why: "Chỉ là ngày giờ trên đồng hồ. Gắn múi giờ rồi mới đổi sang `Instant`." },
        ],
      },
    },
  ],
  cards: [
    { q: "Instant, LocalDateTime, ZonedDateTime khác nhau thế nào?", a: "Instant là một thời điểm UTC. LocalDateTime là ngày giờ trần, không múi giờ. ZonedDateTime là ngày giờ kèm múi giờ. Lưu bằng Instant, đổi múi giờ khi hiển thị." },
    { q: "Duration khác Period thế nào?", a: "Duration đo giờ, phút, giây (thời gian máy). Period đo ngày, tháng, năm (lịch). Qua DST ngày 8/3 ở New York, một ngày lịch chỉ dài 23 giờ." },
    { q: "Vì sao plus(Duration.ofHours(24)) khác plusDays(1)?", a: "Qua ngày đổi giờ, 24 giờ lệch một giờ trên đồng hồ. plusDays giữ đúng giờ địa phương. Việc lặp mỗi ngày là phép tính lịch." },
    { q: "Gap và overlap là gì?", a: "Gap: giờ không tồn tại khi đồng hồ nhảy tiến (02:30 bị đẩy thành 03:30). Overlap: giờ xuất hiện hai lần khi nhảy lùi (mặc định lần đầu, withLaterOffsetAtOverlap chọn lần sau)." },
    { q: "Vì sao SimpleDateFormat nguy hiểm?", a: "Có trạng thái bên trong, dùng chung giữa nhiều thread cho kết quả sai hoặc exception. DateTimeFormatter bất biến nên an toàn." },
    { q: "Nên lưu và truyền thời gian thế nào?", a: "UTC, chuỗi ISO-8601 có Z hoặc độ lệch. Chuỗi thiếu múi giờ làm Instant.parse ném DateTimeParseException. Giờ người dùng nhập thì gắn múi giờ của họ rồi đổi sang Instant." },
  ],
  modelAnswer:
    "Em lưu thời điểm bằng Instant (UTC) và chỉ đổi múi giờ khi hiển thị, vì LocalDateTime không có múi giờ nên không xác định được thời điểm thật. Em phân biệt Duration (giờ, phút, giây) với Period (lịch): qua ngày đổi giờ mùa hè một ngày chỉ dài 23 giờ, nên việc lặp mỗi ngày em dùng plusDays. Em biết giờ có thể không tồn tại hoặc xuất hiện hai lần, và để lịch hệ thống chạy theo UTC. Em không dùng SimpleDateFormat dùng chung vì không an toàn thread, mà dùng DateTimeFormatter bất biến. Trong API em truyền ISO-8601 có Z.",
};
