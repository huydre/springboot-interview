import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Lld1.java: parking lot with fee strategy, three rate limiters driven by a fake clock).
export const lld1: Lesson = {
  slug: "lld-1",
  crumb: "LLD 1: Parking Lot, Rate Limiter",
  videoDir: "/videos/lld-1",
  videoVersion: "0",
  scenes: [],
  title: "LLD 1: Khung trả lời, Parking Lot, Rate Limiter",
  subtitle:
    "Bài thiết kế mức class (Low-Level Design) hay hỏi trong phỏng vấn. Học khung 5 bước, rồi giải hai bài kinh điển bằng code chạy thật: bãi đỗ xe và giới hạn tốc độ.",
  openingQuiz: {
    question: "Đề LLD: \"Thiết kế bãi đỗ xe\". Việc đầu tiên nên làm là gì?",
    options: [
      "Viết code ngay cho nhanh",
      "Hỏi lại để làm rõ yêu cầu: các loại xe, loại chỗ, cách tính phí, một hay nhiều cổng",
      "Vẽ ngay sơ đồ cơ sở dữ liệu",
      "Chọn framework",
    ],
    answer: 1,
    explain: "Đề LLD cố ý mơ hồ. Hỏi để chốt phạm vi trước cho thấy bạn biết thiết kế dựa trên yêu cầu, và tránh làm sai bài.",
  },
  roadmap: [
    "Chặng 1: khung 5 bước trả lời bài LLD.",
    "Chặng 2: Parking Lot. Chọn chỗ, tính phí bằng Strategy, và vì sao tránh chuỗi if theo loại xe.",
    "Chặng 3: Rate Limiter. Fixed window, sliding log, token bucket và bẫy burst.",
  ],
  sections: [
    {
      id: "khung",
      title: "Khung 5 bước trả lời bài LLD",
      intro: [
        "Người phỏng vấn chấm **cách bạn tư duy**, không chỉ code cuối cùng. Một khung cố định giúp bạn không bỏ sót và nói mạch lạc. Bấm từng bước để xem câu nên nói.",
      ],
      widgetTitle: "5 bước",
      cheat: [
        { name: "1. Làm rõ yêu cầu", one: "Hỏi phạm vi, ràng buộc, và điều không làm.", say: "Em xin phép chốt trước: có những loại xe nào, tính phí ra sao, một hay nhiều cổng, và có cần chạy đa luồng không. Phần nào ngoài phạm vi em sẽ nói rõ để khỏi làm thừa." },
        { name: "2. Tìm entity và hành động", one: "Danh từ thành class, động từ thành method.", say: "Từ yêu cầu em rút ra các danh từ: Vehicle, Spot, Ticket, ParkingLot. Còn động từ là park, leave, calculateFee." },
        { name: "3. Quan hệ và interface", one: "Chỗ nào thay đổi thì đặt sau interface.", say: "Phần dễ đổi như cách tính phí và cách chọn chỗ em đặt sau interface (Strategy). Phần ổn định em để class cụ thể cho đơn giản." },
        { name: "4. Code phần cốt lõi", one: "Làm luồng chính chạy đúng trước, rồi mới nói biên.", say: "Em viết luồng park rồi leave chạy được, kèm xử lý lỗi: hết chỗ, vé không tồn tại. Em kiểm tra bằng vài tình huống nhỏ." },
        { name: "5. Mở rộng và đánh đổi", one: "Nói trước các câu hỏi tiếp theo.", say: "Nếu cần nhiều tầng em dùng Composite, nhiều cổng cùng lúc em cần đồng bộ trên tập chỗ, nhiều server thì trạng thái phải lưu ở database hoặc Redis." },
      ],
      after: [
        "Với mỗi bài sau, ta đi đúng khung này: yêu cầu, thiết kế chỗ đổi được, code chạy thật, rồi mở rộng.",
      ],
      trap: {
        title: "Nhảy vào code, hoặc thiết kế quá đà",
        text: "Hai lỗi ngược nhau: code ngay khi chưa hiểu đề, và vẽ 20 class cho yêu cầu đơn giản (over-engineering). Chốt yêu cầu trước, rồi chỉ trừu tượng hoá chỗ **thật sự** thay đổi.",
      },
      quiz: {
        question: "Trong bài LLD, phần nào nên đặt sau interface (Strategy)?",
        options: [
          "Mọi class cho đồng nhất",
          "Phần dễ thay đổi, như cách tính phí hay cách chọn chỗ",
          "Chỉ các class dữ liệu",
          "Không phần nào",
        ],
        answer: 1,
        explain: "Trừu tượng hoá có chi phí. Chỉ làm ở chỗ thay đổi thật, đúng tinh thần OCP và YAGNI.",
      },
    },
    {
      id: "parking-lot",
      title: "Parking Lot: chọn chỗ và tính phí",
      intro: [
        "**Yêu cầu**: bãi xe có chỗ nhỏ, vừa, lớn. Xe máy, ô tô, xe tải cần chỗ khác nhau. Vào bãi nhận vé, ra bãi tính phí theo giờ.",
        "Hai điểm cốt lõi: **chọn chỗ** (nhỏ nhất vẫn vừa, để dành chỗ lớn) và **tính phí** (chính sách đổi được).",
      ],
      widgetTitle: "Thêm yêu cầu mới vào bãi đỗ",
      compare: [
        way(
          "if / else theo loại xe",
          `Ticket park(String type) {
  if (type.equals("CAR")) { /* tìm chỗ vừa */ }
  else if (type.equals("TRUCK")) { /* tìm chỗ lớn */ }
}
long fee(String type, int min) { if (type.equals("CAR")) return 20000 * hours; ... }`,
          [
            ask("Thêm xe điện", bad("Sửa cả `park()` lẫn `fee()`, thêm nhánh `if` ở nhiều nơi.")),
            ask("Đổi cách tính phí", bad("Mở `fee()` ra sửa, lẫn với logic chọn chỗ.")),
            ask("Gõ sai chuỗi loại xe", bad("Chuỗi `\"Car\"` thay vì `\"CAR\"` vẫn biên dịch, lỗi chỉ lộ lúc chạy.")),
          ],
          "Loại xe là chuỗi nên mọi thay đổi chạm vào nhiều chỗ, và compiler không giúp được gì.",
        ),
        way(
          "Enum và Strategy",
          `enum VehicleType { MOTORCYCLE(SMALL), CAR(MEDIUM), TRUCK(LARGE); final Size need; }
// chọn chỗ nhỏ nhất vẫn vừa
spots.stream().filter(s -> !taken.contains(s.id()) && s.size().compareTo(v.need) >= 0).findFirst()
interface FeePolicy { long fee(VehicleType v, int minutes); }   // Strategy`,
          [
            ask("Thêm xe điện", ok("Thêm một giá trị enum. `park()` không đổi. Đã chạy: xe máy vào `S1`, ô tô vào `M1` và `M2`, khi chỗ vừa đã đầy thì ô tô dùng `L1`.")),
            ask("Đổi cách tính phí", ok("Viết `FeePolicy` mới, `ParkingLot` không đổi. Đã chạy: ô tô đỗ 150 phút trả `60000` (3 giờ × 20000).")),
            ask("Bãi đầy hoặc vé lạ", ok("Đã chạy: `lot full for CAR` và `unknown ticket T999`, lỗi rõ ràng. Sau khi một xe ra, xe sau lại vào được `M1`.")),
          ],
          "Loại xe là kiểu dữ liệu, chính sách phí đứng sau interface. Mỗi yêu cầu mới chỉ chạm một chỗ.",
        ),
      ],
      after: [
        "Mở rộng hay hỏi: nhiều tầng (**Composite**), nhiều cổng vào ra cùng lúc (cần đồng bộ trên tập chỗ đang dùng), đặt chỗ trước (thêm trạng thái giữ chỗ), và lưu vé trong database khi có nhiều server.",
      ],
      trap: {
        title: "Làm tròn giờ khi tính phí",
        text: "Hỏi lại đề: đỗ 150 phút tính 2,5 hay 3 giờ? Ở đây làm tròn **lên** (`ceil(phút / 60)`), tối thiểu 1 giờ. Quy tắc làm tròn là yêu cầu cần chốt, không phải chi tiết nhỏ.",
      },
      quiz: {
        question: "Ô tô cần chỗ vừa, mọi chỗ vừa đã đầy nhưng còn chỗ lớn trống. Cách chọn chỗ nào hợp lý?",
        options: [
          "Từ chối vì hết chỗ vừa",
          "Cho vào chỗ nhỏ nhất vẫn đủ rộng, tức chỗ lớn",
          "Chọn chỗ lớn nhất cho thoải mái",
          "Bắt khách chờ",
        ],
        answer: 1,
        explain: "Quy tắc là chọn chỗ nhỏ nhất vẫn vừa. Đã chạy: khi chỗ vừa đầy, ô tô thứ ba dùng `L1`.",
      },
    },
    {
      id: "rate-limiter",
      title: "Rate Limiter: giới hạn tốc độ",
      intro: [
        "**Yêu cầu**: mỗi người dùng tối đa N yêu cầu trong mỗi khoảng thời gian, vượt thì từ chối (HTTP 429), và phải đúng khi nhiều thread.",
        "Ba thuật toán hay hỏi: **fixed window**, **sliding window log**, **token bucket**. Mỗi cái đánh đổi bộ nhớ, độ chính xác và khả năng chịu burst.",
      ],
      widgetTitle: "Giới hạn 5 yêu cầu mỗi 60 giây",
      compare: [
        way(
          "Fixed window",
          `// bộ đếm reset mỗi 60 giây
if (now - start >= windowMs) { start = now - (now % windowMs); count = 0; }
return count++ < limit;`,
          [
            ask("5 yêu cầu lúc 59s, rồi 5 yêu cầu lúc 60s", bad("Đã chạy: **10 yêu cầu trong 1 giây** đều được chấp nhận, dù giới hạn là 5 mỗi phút. Đây là burst ở ranh giới hai cửa sổ.")),
            ask("Bộ nhớ cho mỗi người dùng", ok("Chỉ hai số (`start` và `count`). Rất nhẹ.")),
          ],
          "Đơn giản và nhẹ, nhưng cho burst gấp đôi ở ranh giới cửa sổ.",
        ),
        way(
          "Sliding log hoặc Token bucket",
          `// token bucket: xô chứa tối đa 5 token, nạp 1 token mỗi giây
tokens = Math.min(capacity, tokens + elapsedMs * refillPerMs);
if (tokens >= 1) { tokens -= 1; return true; }
return false;`,
          [
            ask("5 yêu cầu lúc 59s, rồi 5 yêu cầu lúc 60s", ok("Đã chạy với sliding log: 5 yêu cầu lúc 59s, và **0** lúc 60s. Chính xác, nhưng phải nhớ mọi mốc thời gian nên tốn bộ nhớ O(N).")),
            ask("Token bucket, xô 5 và nạp 1 mỗi giây", ok("Đã chạy: lúc 0s được 5 trong 6 yêu cầu. Lúc 2s được thêm 2 trong 3. Cho phép burst nhỏ nhưng giữ tốc độ trung bình, chỉ cần hai số cho mỗi người dùng.")),
          ],
          "Sliding log chính xác nhưng tốn bộ nhớ. Token bucket cân bằng cả hai và được dùng nhiều nhất.",
        ),
      ],
      after: [
        "Nhiều thread: `synchronized` trên từng limiter (đã dùng khi chạy), hoặc `AtomicLong`. Nhiều server: đếm ở **Redis** (`INCR` kèm `EXPIRE`, hoặc Lua script cho token bucket) để mọi server dùng chung một bộ đếm.",
        "Truyền đồng hồ vào (`LongSupplier`) thay vì gọi `System.currentTimeMillis()`: test không cần `sleep` và kết quả luôn xác định.",
      ],
      trap: {
        title: "Bộ đếm không an toàn khi nhiều thread",
        text: "`count++` không nguyên tử: hai thread có thể cùng đọc một giá trị rồi cùng ghi. Cần `synchronized`, `Atomic`, hoặc để Redis đếm. Ngoài ra đừng dùng `System.currentTimeMillis()` cứng trong code, vì khó test.",
      },
      quiz: {
        question: "Vì sao fixed window có thể cho tới 2N yêu cầu trong thời gian rất ngắn?",
        options: [
          "Vì burst ở ranh giới giữa hai cửa sổ liên tiếp",
          "Vì thuật toán lỗi",
          "Vì thiếu bộ nhớ",
          "Vì chạy đa luồng",
        ],
        answer: 0,
        explain: "N yêu cầu ở cuối cửa sổ này và N yêu cầu ngay đầu cửa sổ sau đều hợp lệ (đã chạy: 10 yêu cầu trong 1 giây).",
      },
    },
  ],
  cards: [
    { q: "Khung 5 bước trả lời bài LLD?", a: "Làm rõ yêu cầu, tìm entity và hành động, quan hệ và interface (chỗ thay đổi), code phần cốt lõi, mở rộng và đánh đổi." },
    { q: "Phần nào nên đặt sau interface?", a: "Chỉ phần dễ thay đổi như cách tính phí hay cách chọn chỗ (Strategy). Trừu tượng hoá có chi phí nên đừng làm cho mọi class." },
    { q: "Chọn chỗ đỗ xe theo quy tắc nào?", a: "Chỗ nhỏ nhất vẫn vừa, để dành chỗ lớn. Khi chỗ vừa đầy, ô tô dùng chỗ lớn." },
    { q: "Vì sao dùng enum cho loại xe thay vì chuỗi?", a: "Compiler bắt lỗi gõ sai, thêm loại mới chỉ thêm một giá trị, và mỗi loại mang theo loại chỗ cần dùng." },
    { q: "Fixed window có nhược điểm gì?", a: "Burst gấp đôi ở ranh giới cửa sổ: 5 yêu cầu lúc 59s và 5 lúc 60s đều được chấp nhận. Nhẹ (hai số) nhưng không chính xác." },
    { q: "Token bucket khác sliding log thế nào?", a: "Sliding log chính xác nhưng nhớ mọi mốc thời gian (O(N)). Token bucket chỉ nhớ hai số, cho burst nhỏ và giữ tốc độ trung bình." },
    { q: "Rate limiter cho nhiều server làm thế nào?", a: "Đếm ở Redis (INCR kèm EXPIRE, hoặc Lua script cho token bucket) để chung một bộ đếm. Trong một JVM thì dùng synchronized hay Atomic." },
  ],
  modelAnswer:
    "Em trả lời bài LLD theo 5 bước: làm rõ yêu cầu, rút entity và hành động, đặt phần dễ đổi sau interface, code luồng chính, rồi nói về mở rộng. Với bãi đỗ xe, em dùng enum cho loại xe, chọn chỗ nhỏ nhất vẫn vừa, và tách cách tính phí thành Strategy để đổi mà không sửa ParkingLot. Với rate limiter, em so sánh fixed window nhẹ nhưng cho burst gấp đôi ở ranh giới, sliding log chính xác nhưng tốn bộ nhớ, và token bucket cân bằng cả hai. Một JVM thì dùng synchronized, nhiều server thì đếm ở Redis.",
};
