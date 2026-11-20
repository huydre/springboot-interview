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
        "**Yêu cầu**: nhiều người chọn ghế cùng lúc. Một ghế chỉ được bán cho **một** người, và giữ chỗ có thời hạn (ví dụ 5 phút để thanh toán).",
        "Lỗi kinh điển là **check-then-act**: kiểm tra ghế còn trống rồi mới đặt. Giữa hai bước có thể có người khác chen vào.",
      ],
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
            ask("Người giữ chỗ bỏ đi", ok("Đã chạy (hạn 5 phút): u1 giữ lúc 0s. u2 thử lúc 100s bị từ chối. u1 xác nhận lúc 200s được. Lúc 301s hết hạn nên u1 không xác nhận được, và u2 giữ được ghế.")),
          ],
          "Kiểm tra và đặt gộp thành một thao tác nguyên tử, hạn giữ chỗ tự giải phóng ghế.",
        ),
      ],
      after: [
        "Cùng ý tưởng với **optimistic locking** (`@Version`) và `UPDATE ... WHERE status = 'FREE'` trong database. Nhiều server thì khoá phải nằm ở database hoặc Redis (`SET NX EX`), không thể nằm trong bộ nhớ của một JVM.",
      ],
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
        "**Yêu cầu**: một thang máy phục vụ nhiều yêu cầu tầng. Cần **trạng thái** (lên, xuống, rảnh) và **chiến lược lập lịch** để khỏi đi lòng vòng.",
        "Hai chiến lược: **FIFO** (theo thứ tự gọi) và **SCAN** (đi hết một chiều rồi mới quay đầu, như thang máy thật).",
      ],
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
            ask("Từ tầng 4, yêu cầu 7, 3, 9, 1, 5", ok("Đã chạy: thứ tự `[5, 7, 9, 3, 1]`, đi **13 tầng** thay vì 25.")),
            ask("Có yêu cầu mới giữa chừng", ok("`TreeSet` tự đặt đúng chỗ, chỉ cần `stops.add(f)`.")),
          ],
          "Đi hết một chiều rồi quay đầu cho quãng đường ngắn hơn nhiều.",
        ),
      ],
      after: [
        "Mô hình hoá bằng **State** (`IDLE`, `UP`, `DOWN`, thêm `DOOR_OPEN` nếu cần) và **Strategy** cho thuật toán lập lịch. Nhiều thang máy thì thêm một **dispatcher** chọn thang gần nhất cùng chiều (giống Mediator).",
      ],
      trap: {
        title: "Đói yêu cầu (starvation)",
        text: "Luôn chọn tầng gần nhất có thể bỏ quên tầng xa mãi mãi. SCAN đi hết một chiều nên mọi yêu cầu đều được phục vụ sau tối đa một lượt đi và về.",
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
        "Phân lớp: `Board` (trạng thái và luật), `Player`, `Game` (lượt đi). Tách luật khỏi giao diện để test không cần vẽ bàn. Hoà khi đủ 42 nước (`moves == ROWS * COLS`).",
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
      intro: ["Bài LLD hay hỏi \"em dùng pattern nào ở đây và vì sao\". Chọn pattern phù hợp cho mỗi tình huống."],
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
