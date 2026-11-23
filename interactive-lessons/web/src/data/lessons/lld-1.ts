import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Lld1.java: parking lot with fee strategy and an EV type, three rate limiters driven by a fake clock).
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
        { name: "5. Mở rộng và đánh đổi", one: "Nói trước các câu hỏi tiếp theo.", say: "Nếu cần nhiều tầng em dùng Composite. Nhiều cổng cùng lúc thì hai cổng có thể cùng chọn chỗ M1, nên chọn chỗ và đánh dấu đã dùng phải là một thao tác nguyên tử (không ai chen vào giữa được, xem bài LLD 2). Nhiều server thì trạng thái phải lưu ở database hoặc Redis (kho dữ liệu trong RAM dùng chung cho nhiều server)." },
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
        "Áp dụng khung 5 bước vào bài kinh điển đầu tiên.",
        "**Yêu cầu**: bãi xe có chỗ nhỏ, vừa, lớn. Xe máy, ô tô, xe tải cần chỗ khác nhau. Vào bãi nhận vé, ra bãi tính phí theo giờ.",
        "Hai điểm cốt lõi: **chọn chỗ** (nhỏ nhất vẫn vừa, để dành chỗ lớn) và **tính phí** (chính sách đổi được).",
      ],
      board: {
        title: "Parking Lot: từ xe vào tới vé",
        highlight: "từ xe vào tới vé",
        chips: ["Chọn chỗ nhỏ nhất vẫn vừa", "Tính phí bằng Strategy"],
        cards: [
          {
            title: "Chọn chỗ",
            diagram: {
              kind: "pipe",
              from: "Xe vào bãi",
              via: "Chọn chỗ vừa",
              to: "Vé",
              skipped: ["if / else theo loại xe"],
              skippedLabel: "Thay bằng enum",
            },
            notes: ["Chọn chỗ nhỏ nhất vẫn vừa để dành chỗ lớn."],
            code: `spots.stream()
        .filter(s -> !taken.contains(s.id()) && s.size().compareTo(v.need) >= 0)
        .findFirst()`,
            takeaway: "Xe chọn chỗ theo kích cỡ, không theo chuỗi",
          },
          {
            title: "Enum loại xe",
            diagram: {
              kind: "hub",
              inputs: [{ label: "MOTORCYCLE (SMALL)" }, { label: "CAR (MEDIUM)" }, { label: "TRUCK (LARGE)" }],
              center: "VehicleType",
              rulesTitle: "Lợi ích",
              rules: ["Gõ sai không biên dịch được", "Mỗi loại biết cỡ chỗ cần"],
            },
            takeaway: "Compiler bắt lỗi thay vì lộ lúc chạy",
          },
        ],
        conclusion: "**Kết luận:** enum cho loại xe, Strategy cho cách tính phí, và chọn chỗ nhỏ nhất vẫn vừa.",
      },
      widgetTitle: "Thêm yêu cầu mới vào bãi đỗ",
      compare: [
        way(
          "if / else theo loại xe",
          `Ticket park(String type) {
  if (type.equals("CAR")) { /* tìm chỗ vừa */ }
  else if (type.equals("TRUCK")) { /* tìm chỗ lớn */ }
}
long fee(String type, int min) {
  if (type.equals("CAR")) return 20000 * (long) Math.ceil(min / 60.0); ...
}`,
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
            ask("Thêm xe điện", ok("Thêm `EV(MEDIUM)` vào enum và một mức giá cho `EV` trong `HourlyFee`. `park()` không đổi. Đã chạy: xe điện vào `M1`, đỗ 90 phút trả `40000` (làm tròn lên 2 giờ × 20000).")),
            ask("Bãi có S1, M1, M2, L1: xe máy rồi ba ô tô lần lượt vào", ok("Đã chạy: xe máy vào `S1`, hai ô tô đầu vào `M1` và `M2`. Chỗ vừa đã đầy nên ô tô thứ ba dùng `L1`, chỗ nhỏ nhất còn vừa.")),
            ask("Đổi cách tính phí", ok("Viết `FeePolicy` mới, `ParkingLot` không đổi. Đã chạy: ô tô đỗ 150 phút trả `60000` (3 giờ × 20000).")),
            ask("Bãi đầy hoặc vé lạ", ok("Đã chạy: `lot full for CAR` và `unknown ticket T999`, lỗi rõ ràng. Sau khi một xe ra, xe sau lại vào được `M1`.")),
          ],
          "Loại xe là kiểu dữ liệu, chính sách phí đứng sau interface. Mỗi yêu cầu mới chỉ chạm một chỗ.",
        ),
      ],
      after: [
        "Mở rộng hay hỏi:",
        "- **Nhiều tầng**: dùng **Composite**.",
        "- **Nhiều cổng vào ra cùng lúc**: hai cổng có thể cùng chọn một chỗ trống, nên chọn chỗ và đánh dấu đã dùng phải là một thao tác nguyên tử.",
        "- **Đặt chỗ trước**: thêm trạng thái giữ chỗ.",
        "- **Nhiều server**: lưu vé trong database.",
      ],
      takeaway: {
        lines: [
          "Loại xe là enum, chính sách phí đứng sau interface. Mỗi yêu cầu mới chỉ chạm **một chỗ**.",
        ],
      },
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
        "Bãi đỗ xe giới hạn số chỗ. Bài thứ hai giới hạn số yêu cầu theo thời gian.",
        "Ba thuật toán hay hỏi, khác nhau ở cách nhớ quá khứ:",
        "- **Fixed window**: chia thời gian thành các cửa sổ cố định (0s tới 60s, 60s tới 120s...), mỗi cửa sổ một bộ đếm, sang cửa sổ mới thì đếm lại từ 0.",
        "- **Sliding log**: giữ mốc thời gian của từng yêu cầu, mỗi lần có yêu cầu mới thì bỏ các mốc cũ hơn 60 giây rồi đếm phần còn lại.",
        "- **Token bucket**: ở phần tiếp theo.",
        "Chúng khác nhau rõ nhất khi có **burst**: nhiều yêu cầu dồn vào cùng một khoảnh khắc. Ví dụ dưới đây: giới hạn 5 yêu cầu mỗi 60 giây, người dùng gửi 5 yêu cầu lúc 59s rồi 5 yêu cầu nữa lúc 60s.",
      ],
      predict: {
        question: "Giới hạn 5 yêu cầu mỗi 60 giây, dùng **fixed window**. Gửi 5 yêu cầu lúc 59s rồi 5 yêu cầu lúc 60s. Được nhận bao nhiêu?",
        options: ["5", "6", "10", "0"],
        answer: 2,
        explain: "Lúc 60s là cửa sổ mới nên bộ đếm về 0, cả 10 yêu cầu đều lọt qua dù chỉ cách nhau 1 giây. Bấm vào hai cách bên dưới để so với sliding log.",
      },
      widgetTitle: "Giới hạn 5 yêu cầu mỗi 60 giây",
      compare: [
        way(
          "Fixed window",
          `// bộ đếm reset mỗi 60 giây
if (now - start >= windowMs) { start = now - (now % windowMs); count = 0; }
return count++ < limit;`,
          [
            ask("5 yêu cầu lúc 59s, rồi 5 yêu cầu lúc 60s", bad("Đã chạy: **10 yêu cầu trong 1 giây** đều được chấp nhận, dù giới hạn là 5 mỗi phút. Lúc 60s là cửa sổ mới nên bộ đếm về 0: burst ở ranh giới hai cửa sổ.")),
            ask("Bộ nhớ cho mỗi người dùng", ok("Chỉ hai số (`start` và `count`). Rất nhẹ.")),
          ],
          "Đơn giản và nhẹ, nhưng cho burst gấp đôi ở ranh giới cửa sổ.",
        ),
        way(
          "Sliding log",
          `// log: mốc thời gian của các yêu cầu đã nhận
while (!log.isEmpty() && now - log.peekFirst() >= windowMs)
    log.pollFirst();               // bỏ mốc cũ hơn 60 giây
if (log.size() < limit) { log.addLast(now); return true; }
return false;`,
          [
            ask("5 yêu cầu lúc 59s, rồi 5 yêu cầu lúc 60s", ok("Đã chạy: 5 được nhận lúc 59s, **0** lúc 60s. Lúc 60s, 5 mốc của giây 59 vẫn còn trong 60 giây gần nhất, nên log đã đủ 5.")),
            ask("Bộ nhớ cho mỗi người dùng", bad("Phải nhớ tới N mốc thời gian cho mỗi người dùng, tức O(N). Giới hạn 1000 yêu cầu mỗi phút là 1000 số cho mỗi người.")),
          ],
          "Chính xác tuyệt đối, nhưng tốn bộ nhớ theo N.",
        ),
      ],
      after: [
        "Nhiều thread: code trên đặt `synchronized` (chỉ một thread được chạy method tại một thời điểm) trên `allow()` của từng limiter. Một cách khác cho bộ đếm đơn là `AtomicLong`, tăng số một cách nguyên tử. Cả hai học kỹ ở bài sync trong khoá Concurrency.",
        "Truyền đồng hồ vào (`LongSupplier`) thay vì gọi `System.currentTimeMillis()`: test không cần `sleep` và kết quả luôn xác định. Mọi kết quả ở đây chạy với một đồng hồ giả như vậy.",
      ],
      takeaway: {
        lines: [
          "**Fixed window**: nhẹ (hai số) nhưng lọt burst gấp đôi ở ranh giới cửa sổ.",
          "**Sliding log**: chính xác nhưng nhớ tới N mốc thời gian cho mỗi người dùng.",
        ],
      },
      trap: {
        title: "Bộ đếm không an toàn khi nhiều thread",
        text: "`count++` không nguyên tử: nó gồm đọc, cộng một, ghi lại. Hai thread có thể cùng đọc 4, cùng ghi 5, và cả hai yêu cầu đều lọt qua. Cần `synchronized`, `AtomicLong`, hoặc để Redis đếm.",
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
        explain: "N yêu cầu ở cuối cửa sổ này và N yêu cầu ngay đầu cửa sổ sau đều hợp lệ, vì bộ đếm về 0 khi sang cửa sổ mới (đã chạy: 10 yêu cầu trong 1 giây).",
      },
      parts: [
        {
          id: "token-bucket",
          title: "Token bucket: nhẹ mà vẫn giữ tốc độ",
          intro: [
            "Fixed window nhẹ nhưng lọt burst, sliding log chặt nhưng nặng. Token bucket lấy điểm tốt của cả hai.",
            "**Token bucket**: mỗi người dùng có một cái xô chứa tối đa 5 token, ban đầu đầy. Token được nạp lại đều đặn, ở đây 1 token mỗi giây, không vượt quá 5. Mỗi yêu cầu lấy một token; xô rỗng thì từ chối.",
            "Kịch bản so sánh: lúc 0s người dùng gửi dồn 6 yêu cầu, lúc 2s gửi thêm 3. Sliding log vẫn giới hạn 5 yêu cầu mỗi 60 giây như trên.",
          ],
          board: {
            title: "Token bucket: xô token",
            highlight: "xô token",
            chips: ["Xô tối đa 5 token", "Nạp 1 token mỗi giây"],
            cards: [
              {
                title: "Mỗi yêu cầu lấy một token",
                diagram: {
                  kind: "flow",
                  steps: ["Nạp token theo thời gian", "Yêu cầu lấy 1 token"],
                  ok: ["Còn token", "Cho qua"],
                  bad: ["Xô rỗng", "Từ chối (429)"],
                },
                notes: ["Cho phép một đợt dồn ngắn, nhưng về lâu dài chỉ 1 yêu cầu mỗi giây. Mỗi người dùng chỉ cần hai số: `tokens` và `last`."],
                code: `tokens = Math.min(capacity, tokens + elapsedMs * refillPerMs);
          last = now;
          if (tokens >= 1) { tokens -= 1; return true; }
          return false;`,
                takeaway: "Nhẹ như fixed window, không burst ở ranh giới",
              },
            ],
            conclusion: "**Kết luận:** token bucket nhẹ, giữ đúng tốc độ trung bình và được dùng nhiều nhất.",
          },
          widgetTitle: "6 yêu cầu lúc 0s, 3 yêu cầu lúc 2s",
          compare: [
            way(
              "Sliding log (5 mỗi 60 giây)",
              `// như phần trên: đếm các mốc trong 60 giây gần nhất
if (log.size() < limit) { log.addLast(now); return true; }
return false;`,
              [
                ask("6 yêu cầu lúc 0s, 3 yêu cầu lúc 2s", ok("Đã chạy: 5 trong 6 lúc 0s, **0** trong 3 lúc 2s. Phải chờ tới giây 60 mới gửi tiếp được.")),
                ask("Bộ nhớ cho mỗi người dùng", bad("Tới N mốc thời gian.")),
              ],
              "Chặt, nhưng nặng.",
            ),
            way(
              "Token bucket (xô 5, nạp 1 mỗi giây)",
              `tokens = Math.min(capacity, tokens + elapsedMs * refillPerMs);
last = now;
if (tokens >= 1) { tokens -= 1; return true; }
return false;`,
              [
                ask("6 yêu cầu lúc 0s, 3 yêu cầu lúc 2s", ok("Đã chạy: 5 trong 6 lúc 0s (xô đầy 5 token). Sau 2 giây xô có lại 2 token, nên lúc 2s được 2 trong 3. Cho một đợt dồn ngắn, nhưng về lâu dài chỉ 1 yêu cầu mỗi giây.")),
                ask("Bộ nhớ cho mỗi người dùng", ok("Chỉ hai số: `tokens` và `last` (lần nạp cuối).")),
              ],
              "Nhẹ như fixed window, không có burst ở ranh giới. Được dùng nhiều nhất.",
            ),
          ],
          after: [
            "Nhiều server thì mỗi server tự đếm là sai (người dùng được N lần ở mỗi server), nên bộ đếm phải nằm ở **Redis**, một kho dữ liệu trong RAM mà mọi server dùng chung. Fixed window trên Redis là `INCR` (tăng đếm) rồi `EXPIRE` (đặt thời hạn), gộp trong một Lua script để hai lệnh không bị tách đôi (giải thích đầy đủ ở bài System Design Concepts, phần Rate limiting). Token bucket cũng làm bằng Lua. Chi tiết ở bài redis-patterns.",
          ],
          takeaway: {
            title: "Chuỗi nhân quả cần nhớ",
            lines: [
              "Nhiều server → bộ đếm phải dùng chung ở Redis → `INCR` và `EXPIRE` gộp trong một Lua script để không bị tách đôi.",
            ],
          },
          quiz: {
            question: "Xô token bucket chứa tối đa 5, nạp 1 token mỗi giây, đang đầy. Gửi 6 yêu cầu lúc 0s rồi 3 yêu cầu lúc 2s. Được nhận tổng cộng bao nhiêu?",
            options: ["5", "7", "9", "10"],
            answer: 1,
            explain: "Lúc 0s dùng hết 5 token, yêu cầu thứ 6 bị từ chối. Hai giây sau xô có lại 2 token, nên được thêm 2 trong 3. Tổng 7 (đã chạy với đồng hồ giả).",
          },
        },
      ],
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
