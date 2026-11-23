import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (Lld2.java: 16-thread seat race, seat hold with a fake clock, FIFO vs SCAN elevator from floor 4, Connect Four moves and errors).
export const lld2: Lesson = {
  slug: "lld-2",
  crumb: "LLD 2: Movie Ticket, Elevator, Connect Four",
  videoDir: "/videos/lld-2",
  videoVersion: "0",
  scenes: [],
  title: "LLD 2: Movie Ticket, Elevator, Connect Four",
  subtitle:
    "Ba bài LLD tiếp theo: đặt ghế khi nhiều người tranh nhau (đa luồng), thang máy (State và lập lịch), và Connect Four (luật trò chơi). Cuối bài ghép các pattern vào từng bài toán.",
  openingQuiz: {
    question: "Hai người cùng bấm đặt ghế A1 vào cùng một mili giây. Điều quan trọng nhất của thiết kế là gì?",
    options: [
      "Chỉ một người được ghế, và việc kiểm tra rồi đặt phải là MỘT thao tác không bị chen ngang",
      "Cho cả hai đặt được rồi tính sau",
      "Dùng nhiều thread hơn",
      "Hiện thông báo lỗi chung",
    ],
    answer: 0,
    explain: "Đây là race condition. Kiểm tra \"ghế còn trống\" rồi mới đặt là hai bước, giữa chúng có thể có người chen vào.",
  },
  roadmap: [
    "Chặng 1: Movie Ticket. Check-then-act, thao tác nguyên tử, và giữ chỗ có thời hạn.",
    "Chặng 2: Elevator. State và hai chiến lược lập lịch, FIFO và SCAN.",
    "Chặng 3: Connect Four và bài tập ghép pattern vào bài toán.",
  ],
  sections: [
    {
      id: "movie-ticket",
      title: "Movie Ticket: nhiều người tranh một ghế",
      intro: [
        "Ở bài LLD 1, nhiều cổng cùng chọn một chỗ đỗ là chuyện để mở rộng. Ở bài này nó là yêu cầu chính.",
        "**Yêu cầu**: nhiều người chọn ghế cùng lúc. Một ghế chỉ được bán cho **một** người, và giữ chỗ có thời hạn (ví dụ 5 phút để thanh toán).",
        "Lỗi kinh điển là {{check-then-act}}: kiểm tra ghế còn trống rồi mới đặt, giữa hai bước có người khác chen vào ({{race-condition}}).",
        "Cách chữa gom hai bước thành một: `putIfAbsent(seat, user)` là \"đặt nếu chưa có\", trả `null` khi đặt được (xem kỹ ở cuối phần này).",
      ],
      predict: {
        question: "16 thread cùng gọi `if (!booked.containsKey(seat)) booked.put(seat, user)` trên một `ConcurrentHashMap`. Bao nhiêu người mua được ghế A1?",
        options: [
          "Đúng 1, vì `ConcurrentHashMap` an toàn khi nhiều thread",
          "Có thể nhiều hơn 1",
          "Không ai, vì các thread khoá lẫn nhau",
          "Luôn đúng 16",
        ],
        answer: 1,
        explain: "Từng lời gọi `containsKey` và `put` an toàn, nhưng giữa hai lời gọi vẫn có khe hở. Nhiều thread cùng thấy ghế trống trước khi ai kịp đặt.",
      },
      widgetTitle: "16 người cùng đặt ghế A1",
      compare: [
        way(
          "Kiểm tra rồi mới đặt",
          `boolean book(String seat, String user) {
  if (!booked.containsKey(seat)) {      // hai thread cùng thấy ghế trống
    booked.put(seat, user);
    return true;
  }
  return false;
}`,
          [
            ask("16 người cùng đặt ghế A1", bad("Đã chạy: **nhiều hơn 1 người** mua được cùng một ghế. Dù dùng `ConcurrentHashMap`: từng thao tác an toàn, nhưng chuỗi hai bước thì không.")),
            ask("Người giữ chỗ bỏ đi không thanh toán", bad("Không có hạn giữ chỗ, ghế bị khoá mãi.")),
          ],
          "Mỗi thao tác an toàn riêng lẻ, nhưng ghép lại thì không nguyên tử.",
        ),
        way(
          "Thao tác nguyên tử và giữ chỗ có hạn",
          `booked.putIfAbsent(seat, user) == null            // kiểm tra và đặt là MỘT bước

holds.compute(seat, (k, cur) ->
    cur == null || cur.expiresAt() <= now ? new Hold(user, now + ttl) : cur);`,
          [
            ask("16 người cùng đặt ghế A1", ok("Đã chạy: đúng **1** người mua được.")),
            ask("Người giữ chỗ bỏ đi", ok("Đã chạy hai lần riêng (hạn 5 phút = 300s, u1 luôn giữ lúc 0s, u2 thử lúc 100s và bị từ chối). Lần (a): u1 xác nhận lúc 200s thì được. Lần (b): u1 bỏ đi không xác nhận; lúc 301s hold đã hết hạn nên u1 xác nhận thất bại, và u2 giữ được ghế.")),
          ],
          "Kiểm tra và đặt gộp thành một thao tác nguyên tử, hạn giữ chỗ tự giải phóng ghế.",
        ),
      ],
      after: [
        "Hai method của `Map` làm việc này. `putIfAbsent(seat, user)`: đặt nếu chưa có, và trả `null` khi chính lời gọi này vừa đặt được (nên `== null` nghĩa là \"tôi giành được ghế\"); nếu đã có người thì trả về tên người đó. `compute(seat, f)` chạy hàm `f` trên giá trị hiện tại rồi lưu kết quả, và với `ConcurrentHashMap` cả việc đọc, tính, ghi diễn ra như một bước: không thread nào chen vào giữa.",
        "Đọc lambda của `compute` bằng lời: nếu chưa ai giữ ghế (`cur == null`) hoặc lượt giữ cũ đã hết hạn (`cur.expiresAt() <= now`) thì tạo lượt giữ mới cho `user`, ngược lại giữ nguyên lượt giữ hiện tại.",
        "Khi có database và nhiều server, cùng ý tưởng đó có ba dạng, học ở các bài sau:",
        "- **{{optimistic-lock|Optimistic locking}} với `@Version`** (bài locking): mỗi dòng có số phiên bản, ghi đè phiên bản cũ thì bị từ chối.",
        "- **`UPDATE seat SET status = 'HELD' WHERE id = ? AND status = 'FREE'`**: chỉ người đầu tiên cập nhật được dòng đó, những người sau cập nhật 0 dòng.",
        "- **Redis `SET key value NX EX 300`** (bài redis-patterns): chỉ đặt khi key chưa có, tự hết hạn sau 300 giây.",
        "Khoá trong bộ nhớ một JVM không dùng được khi nhiều server.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Kiểm tra và đặt là hai bước → người khác chen vào giữa → gộp thành **một thao tác nguyên tử** (`putIfAbsent`, `compute`, `UPDATE ... WHERE`, `SET NX`).",
        ],
      },
      trap: {
        title: "An toàn từng bước không có nghĩa là an toàn khi ghép",
        text: "`containsKey` an toàn, `put` an toàn, nhưng `if (!containsKey) put` thì không. Hãy dùng thao tác nguyên tử có sẵn như `putIfAbsent` hoặc `compute`, hoặc khoá cả đoạn.",
      },
      quiz: {
        question: "Cách nào đúng để bảo đảm một ghế chỉ bán cho một người trong một JVM?",
        options: [
          "`if (!map.containsKey(seat)) map.put(seat, user)`",
          "`map.putIfAbsent(seat, user) == null`",
          "Kiểm tra hai lần cho chắc",
          "Thêm `Thread.sleep()` giữa hai bước",
        ],
        answer: 1,
        explain: "`putIfAbsent` kiểm tra và đặt trong một thao tác nguyên tử (đã chạy: đúng 1 người mua được ghế).",
      },
    },
    {
      id: "elevator",
      title: "Elevator: State và lập lịch",
      intro: [
        "Bài đặt ghế xoay quanh tranh chấp. Bài thang máy xoay quanh trạng thái và thứ tự phục vụ.",
        "**Yêu cầu**: một thang máy phục vụ nhiều yêu cầu tầng. Cần **trạng thái** (lên, xuống, rảnh) và **chiến lược lập lịch** để khỏi đi lòng vòng.",
        "Hai chiến lược: **FIFO** (theo thứ tự gọi) và **SCAN** (đi hết một chiều rồi mới quay đầu, như thang máy thật). Trong ví dụ, thang đang ở tầng 4 và **đang đi lên**, nên SCAN phục vụ các tầng phía trên trước.",
      ],
      predict: {
        question: "Thang ở tầng 4, **đang đi lên**, có yêu cầu 7, 3, 9, 1, 5. Với SCAN, thang dừng theo thứ tự nào?",
        options: ["7, 3, 9, 1, 5", "5, 7, 9, 3, 1", "3, 1, 5, 7, 9", "5, 3, 7, 1, 9"],
        answer: 1,
        explain: "SCAN phục vụ hết các tầng phía trên theo chiều đang đi (5, 7, 9), hết tầng phía trên thì quay đầu xuống 3, 1. Thứ tự `7, 3, 9, 1, 5` là FIFO.",
      },
      widgetTitle: "Thang máy ở tầng 4, yêu cầu 7, 3, 9, 1, 5",
      compare: [
        way(
          "FIFO",
          `for (int r : requests) moveTo(r);      // đúng thứ tự gọi`,
          [
            ask("Từ tầng 4, yêu cầu 7, 3, 9, 1, 5", bad("Đã chạy: đi **25 tầng**, lên xuống liên tục.")),
            ask("Đổi sang chiến lược khác", bad("Cách lập lịch dính chặt vào vòng lặp, phải viết lại.")),
          ],
          "Dễ viết, công bằng theo thứ tự đến, nhưng tốn đường đi.",
        ),
        way(
          "SCAN với TreeSet",
          `TreeSet<Integer> stops;                          // các tầng cần dừng, tự sắp xếp
Integer next = dir == UP ? stops.ceiling(floor) : stops.floor(floor);   // tầng gần nhất cùng chiều
if (next == null) dir = reverse(dir);                // hết một chiều thì quay đầu`,
          [
            ask("Từ tầng 4 đang đi lên, yêu cầu 7, 3, 9, 1, 5", ok("Đã chạy: thứ tự `[5, 7, 9, 3, 1]`, đi **13 tầng** thay vì 25. Lên 5, 7, 9; không còn tầng nào phía trên nên quay đầu xuống 3, 1.")),
            ask("Có yêu cầu mới giữa chừng", ok("`TreeSet` tự đặt đúng chỗ, chỉ cần `stops.add(f)`.")),
          ],
          "Đi hết một chiều rồi quay đầu cho quãng đường ngắn hơn nhiều.",
        ),
      ],
      after: [
        "Nói chính xác, code trên quay đầu ngay ở yêu cầu cuối cùng (tầng 9) chứ không đi tới tầng trên cùng của toà nhà. Cách đó tên là **LOOK**, một biến thể của SCAN; SCAN gốc đi tới tận đầu mút. Nói được điểm này trong phỏng vấn là cộng điểm.",
        "Pattern trong bài thang máy:",
        "- **Enum trạng thái**: ở đây chỉ là `dir` (`UP`, `DOWN`, `IDLE`), đủ khi mọi trạng thái xử lý yêu cầu giống nhau.",
        "- **State pattern** (mỗi trạng thái là một class): cần khi từng trạng thái phản ứng khác nhau, ví dụ `DOOR_OPEN` bỏ qua lệnh di chuyển cho tới khi cửa đóng.",
        "- **Strategy**: thuật toán lập lịch đặt sau interface để đổi FIFO, SCAN, LOOK.",
        "- **Dispatcher**: nhiều thang máy thì thêm một bộ phận chọn thang gần nhất cùng chiều (giống Mediator).",
      ],
      takeaway: {
        lines: [
          "Trạng thái xử lý giống nhau thì enum là đủ. Trạng thái phản ứng khác nhau mới cần **State pattern**.",
        ],
      },
      trap: {
        title: "Đói yêu cầu (starvation)",
        text: "Có một chiến lược thứ ba nghe rất hợp lý: luôn đi tới tầng **gần nhất** đang chờ (shortest seek first). Nhưng nếu người ở tầng 3, 4, 5 cứ liên tục gọi, thang cứ quanh quẩn ở đó và người ở tầng 20 chờ mãi. SCAN không bị vậy: nó đi hết một chiều mới quay đầu, nên mọi yêu cầu được phục vụ sau tối đa một lượt đi và về.",
      },
      quiz: {
        question: "Vì sao SCAN thường tốt hơn FIFO về quãng đường?",
        options: [
          "Vì nó gom các tầng cùng chiều thành một lượt đi, ít đổi chiều",
          "Vì nó chạy nhanh hơn",
          "Vì nó dùng ít bộ nhớ hơn",
          "Vì nó bỏ qua một số yêu cầu",
        ],
        answer: 0,
        explain: "Đã chạy: FIFO đi 25 tầng, SCAN đi 13 tầng cho cùng bộ yêu cầu.",
      },
    },
    {
      id: "connect-four",
      title: "Connect Four: luật trò chơi",
      intro: [
        "Bài cuối không có tranh chấp hay lập lịch, chỉ có luật chơi và đầu vào sai.",
        "**Yêu cầu**: bàn 6 hàng × 7 cột, hai người lần lượt thả quân. Ai có 4 quân liên tiếp (ngang, dọc, chéo) trước thì thắng.",
        "Phần hay bị hỏi: **kiểm tra thắng** hiệu quả, và xử lý đầu vào sai.",
      ],
      widgetTitle: "Kiểm tra thắng sau mỗi nước",
      compare: [
        way(
          "Quét cả bàn mỗi nước",
          `boolean wins() {
  for (r : mọi hàng) for (c : mọi cột) for (d : 4 hướng) { /* đếm 4 ô liên tiếp */ }   // 42 ô × 4 hướng
}`,
          [
            ask("Mỗi nước đi", bad("Quét cả bàn dù chỉ một quân vừa thay đổi.")),
            ask("Đổi luật thành 5 quân liên tiếp", bad("Phải sửa số 4 rải rác trong code.")),
          ],
          "Đúng nhưng lãng phí, và hằng số luật nằm cứng.",
        ),
        way(
          "Chỉ xét quanh quân vừa thả",
          `int[][] dirs = {{0,1},{1,0},{1,1},{1,-1}};      // ngang, dọc, hai đường chéo
for (int[] d : dirs) {
  int n = 1;                                      // đếm về hai phía của quân vừa thả
  for (int s = -1; s <= 1; s += 2) for (int k = 1; ; k++) { /* ô cùng màu thì n++, khác thì break */ }
  if (n >= 4) return true;
}`,
          [
            ask("Mỗi nước đi", ok("Chỉ xét 4 hướng quanh quân vừa thả, không phụ thuộc kích thước bàn. Đã chạy: thắng dọc sau 7 nước, ngang sau 7 nước, chéo sau 11 nước.")),
            ask("Luật khác (5 quân)", ok("Chỉ cần tham số hoá độ dài chiến thắng `winLength`.")),
            ask("Đầu vào sai", ok("Đã chạy: cột 9 ném `column out of range`, cột đã đầy ném `column 0 is full`.")),
          ],
          "Quân vừa thả là điểm duy nhất có thể tạo ra chuỗi thắng mới, nên chỉ cần xét quanh nó.",
        ),
      ],
      after: [
        "Phân lớp:",
        "- **`Board`**: trạng thái và luật.",
        "- **`Player`**: người chơi.",
        "- **`Game`**: lượt đi.",
        "Tách luật khỏi giao diện để test không cần vẽ bàn. Hoà khi đủ 42 nước (`moves == ROWS * COLS`).",
      ],
      trap: {
        title: "Quên các trường hợp biên",
        text: "Cột ngoài phạm vi, cột đã đầy, và hoà cờ. Liệt kê các trường hợp biên và nói ra là điểm cộng, vì chúng cho thấy bạn nghĩ tới người dùng thật.",
      },
      quiz: {
        question: "Sau mỗi nước đi, vì sao chỉ cần kiểm tra thắng quanh quân vừa thả?",
        options: [
          "Vì mọi chuỗi thắng mới đều phải đi qua quân vừa thả",
          "Vì các quân cũ không còn tính",
          "Vì bàn quá lớn",
          "Vì luật quy định",
        ],
        answer: 0,
        explain: "Trước nước này chưa ai thắng, nên chỉ chuỗi chứa quân mới mới có thể là chuỗi thắng.",
      },
    },
    {
      id: "ghep-pattern",
      title: "Bài tập: ghép pattern vào bài toán",
      intro: ["Ba bài vừa rồi dùng lại cùng một nhóm pattern. Bài LLD hay hỏi \"em dùng pattern nào ở đây và vì sao\". Chọn pattern phù hợp cho mỗi tình huống."],
      widgetTitle: "Pattern nào hợp?",
      drill: {
        choices: ["Strategy", "State", "Composite", "Observer", "Mediator", "Factory Method"],
        summary: "Pattern xuất hiện khi bạn nhận ra dấu hiệu của nó trong yêu cầu, không phải khi cố nhét cho đủ.",
        items: [
          { q: "Bãi đỗ xe có nhiều chính sách tính phí (theo giờ, cuối tuần, thành viên) cần đổi dễ dàng.", a: "Strategy", why: "Mỗi chính sách là một strategy sau interface `FeePolicy`." },
          { q: "Thang máy có các trạng thái rảnh, đang lên, đang xuống, mở cửa, mỗi trạng thái xử lý yêu cầu khác nhau.", a: "State", why: "Hành vi đổi theo trạng thái hiện tại." },
          { q: "Bãi đỗ nhiều tầng, mỗi tầng nhiều khu, mỗi khu nhiều chỗ, cần đếm chỗ trống ở mọi cấp.", a: "Composite", why: "Cây tầng, khu, chỗ cùng một giao diện." },
          { q: "Khi một ghế được giải phóng, cần báo cho những người đang chờ ghế đó.", a: "Observer", why: "Phát sự kiện cho nhiều người nghe." },
          { q: "Hệ thống nhiều thang máy cần một bộ phận quyết định thang nào đón khách.", a: "Mediator", why: "Một điểm điều phối thay vì các thang nói chuyện chéo." },
          { q: "Tạo đúng loại xe (máy, ô tô, tải) từ biển số hoặc dữ liệu cảm biến.", a: "Factory Method", why: "Che việc `new` class cụ thể khỏi nơi dùng." },
        ],
      },
    },
  ],
  cards: [
    { q: "Check-then-act là gì, vì sao nguy hiểm?", a: "Kiểm tra điều kiện rồi mới hành động, hai bước tách rời nên có thể bị chen ngang (race condition). Dùng thao tác nguyên tử như putIfAbsent hoặc compute." },
    { q: "ConcurrentHashMap có chống được double-booking không?", a: "Từng thao tác thì an toàn, nhưng if (!containsKey) put là hai bước nên vẫn lỗi. Phải dùng putIfAbsent hoặc compute để gộp thành một bước." },
    { q: "Giữ chỗ có hạn làm thế nào?", a: "Lưu hold gồm user và thời điểm hết hạn. Khi giữ, nếu hold cũ đã hết hạn thì thay bằng hold mới. Xác nhận chỉ thành công khi hold còn hạn và đúng người." },
    { q: "Nhiều server thì khoá ghế ở đâu?", a: "Ở database (UPDATE ... WHERE status = 'FREE', hoặc @Version) hay Redis (SET NX EX), không thể ở bộ nhớ của một JVM." },
    { q: "FIFO và SCAN khác nhau thế nào?", a: "FIFO phục vụ theo thứ tự gọi, tốn đường (25 tầng trong ví dụ). SCAN đi hết một chiều rồi quay đầu (13 tầng), và tránh bỏ đói tầng xa." },
    { q: "Vì sao chỉ kiểm tra thắng quanh quân vừa thả?", a: "Mọi chuỗi thắng mới đều đi qua quân đó. Xét 4 hướng hai phía, chi phí không phụ thuộc kích thước bàn." },
  ],
  modelAnswer:
    "Với đặt vé, em tránh check-then-act bằng thao tác nguyên tử như putIfAbsent, và giữ chỗ có thời hạn bằng hold có expiresAt. Nhiều server thì khoá ở database hoặc Redis. Với thang máy, em dùng State cho trạng thái, Strategy cho lập lịch: SCAN đi hết một chiều rồi quay đầu nên ngắn hơn FIFO (13 so với 25 tầng trong ví dụ) và không bỏ đói yêu cầu xa. Với Connect Four, em chỉ kiểm tra thắng quanh quân vừa thả theo 4 hướng, và xử lý các trường hợp biên như cột đầy hay ngoài phạm vi.",
};
