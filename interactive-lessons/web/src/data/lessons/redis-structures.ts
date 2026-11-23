import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every command and output below was run against Redis 8.6.2 on a private instance (port 6399); the GET+SET race used 4 concurrent clients.
// The big-key DEL vs UNLINK timing used two 2,000,000-field hashes on a local Redis 8.6.2 with persistence off.
export const redisStructures: Lesson = {
  slug: "redis-structures",
  crumb: "Redis Data Structures",
  videoDir: "/videos/redis-structures",
  videoVersion: "0",
  scenes: [],
  title: "Redis: chọn đúng cấu trúc dữ liệu",
  subtitle:
    "String, Hash, Sorted Set, Set, HyperLogLog, Stream. Mỗi cấu trúc giải một loại bài toán, và chọn đúng thì không cần viết code ở ứng dụng. Có kết quả lệnh chạy thật trên Redis 8.",
  openingQuiz: {
    question: "Redis chỉ là cache dạng key-value?",
    options: [
      "Đúng, chỉ có chuỗi",
      "Không, nó có nhiều cấu trúc dữ liệu (Hash, List, Set, Sorted Set, Stream...) với các thao tác nguyên tử",
      "Đúng, nhưng nhanh hơn database",
      "Không, nó là database quan hệ",
    ],
    answer: 1,
    explain: "Sức mạnh của Redis là các cấu trúc dữ liệu có thao tác nguyên tử, như tăng bộ đếm, xếp hạng, đếm duy nhất, hàng đợi.",
  },
  roadmap: [
    "Chặng 1: String và Hash. Bộ đếm nguyên tử và lưu object.",
    "Chặng 2: Sorted Set, Set và HyperLogLog. Xếp hạng và đếm người dùng duy nhất.",
    "Chặng 3: Pub/Sub và Stream, rồi bài tập chọn cấu trúc.",
  ],
  sections: [
    {
      id: "string-incr",
      title: "String và INCR: bộ đếm nguyên tử",
      intro: [
        "Kiểu cơ bản nhất là **String**. Với số, `INCR` tăng giá trị **nguyên tử** trên server.",
        "Viết `GET` rồi `SET` ở ứng dụng là hai bước, nên nhiều client chạy cùng lúc sẽ ghi đè lẫn nhau.",
      ],
      predict: {
        question: "4 client chạy cùng lúc, mỗi client làm 2000 lần `GET cnt` rồi `SET cnt v+1`. Giá trị cuối của `cnt` là bao nhiêu?",
        options: [
          "Đúng 8000",
          "Ít hơn 8000 khá nhiều, vì các client ghi đè nhau",
          "Nhiều hơn 8000",
          "Redis báo lỗi xung đột",
        ],
        answer: 1,
        explain: "Hai client cùng đọc 5 thì cùng ghi 6, mất một lần tăng. Lặp lại hàng nghìn lần là mất rất nhiều.",
      },
      widgetTitle: "4 client, mỗi client tăng 2000 lần",
      compare: [
        way(
          "GET rồi SET",
          `v = GET cnt          # client A đọc 5
SET cnt v+1          # client B cũng đọc 5, cả hai cùng ghi 6`,
          [
            ask("4 client, mỗi client tăng 2000 lần", bad("Đã chạy: tổng chỉ **2781** thay vì 8000. Hai bước đọc và ghi tách rời nên các client ghi đè nhau.")),
          ],
          "Đọc rồi ghi ở ứng dụng là check-then-act (kiểm tra giá trị rồi hành động dựa trên nó, trong khi giá trị có thể đã đổi giữa hai bước), không an toàn.",
        ),
        way(
          "INCR",
          `INCR cnt             # server tăng trong một lệnh, không ai chen vào được
INCRBY views 10`,
          [
            ask("4 client, mỗi client tăng 2000 lần", ok("Đã chạy: đúng **8000**. Redis xử lý lệnh tuần tự trên một luồng nên mỗi lệnh là nguyên tử.")),
            ask("Đặt thời hạn", ok("`SET k v EX 100` đặt giá trị và thời hạn trong một lệnh. Đã chạy: `TTL k` ra `100`.")),
          ],
          "Để Redis tự tăng, ứng dụng không cần khoá.",
        ),
      ],
      after: [
        "Dùng cho đếm lượt xem, số lần gọi API, sinh ID tăng dần. Ý tưởng chung: **đưa phép tính tới dữ liệu** thay vì kéo dữ liệu về ứng dụng.",
      ],
      trap: {
        title: "Đọc, sửa, ghi ở ứng dụng",
        text: "Mỗi khi thấy mình viết `GET` rồi `SET` dựa trên giá trị vừa đọc, hãy tìm lệnh nguyên tử tương ứng (`INCR`, `HINCRBY`, `SETNX`: ghi nếu key chưa có) hoặc dùng Lua (script nhỏ chạy trên server Redis như một lệnh nguyên tử, xem bài Redis Patterns).",
      },
      quiz: {
        question: "Vì sao `INCR` an toàn hơn `GET` rồi `SET`?",
        options: [
          "Vì nó thực hiện đọc và ghi trong một lệnh nguyên tử trên server",
          "Vì nó nhanh hơn",
          "Vì nó dùng nhiều thread",
          "Vì nó có khoá phân tán",
        ],
        answer: 0,
        explain: "Đã chạy: `INCR` ra đúng 8000, còn `GET`+`SET` chỉ ra 2781 vì các client ghi đè nhau.",
      },
    },
    {
      id: "hash",
      title: "Hash: một object nhiều field",
      intro: [
        "String lưu một giá trị dưới một key. Còn object nhiều field như hồ sơ người dùng thì sao? **Hash** lưu nhiều cặp field và giá trị dưới một key, hợp với object như hồ sơ người dùng. Bạn đọc hay sửa **từng field** mà không đụng các field còn lại.",
      ],
      widgetTitle: "Cập nhật tuổi của người dùng",
      compare: [
        way(
          "Cả object là một chuỗi JSON",
          `SET user:1 '{"name":"An","age":30,"city":"HN"}'
# đổi tuổi: GET, parse, sửa, serialize, SET lại cả chuỗi`,
          [
            ask("Chỉ đổi tuổi", bad("Phải đọc và ghi lại **cả object**, và hai client cùng sửa hai field khác nhau có thể ghi đè nhau.")),
            ask("Chỉ cần tên", bad("Vẫn phải tải cả chuỗi về rồi mới lấy tên.")),
          ],
          "Mọi thao tác đều ở mức cả object.",
        ),
        way(
          "Hash",
          `HSET user:1 name An age 30 city HN
HGET user:1 name
HINCRBY user:1 age 1`,
          [
            ask("Chỉ đổi tuổi", ok("Đã chạy: `HINCRBY user:1 age 1` ra `31`, chỉ đụng field `age`, nguyên tử.")),
            ask("Chỉ cần tên", ok("Đã chạy: `HGET user:1 name` ra `An`. Không phải tải các field khác.")),
          ],
          "Thao tác theo từng field, nguyên tử và gọn.",
        ),
      ],
      after: [
        "Hash không hỗ trợ lồng sâu: một field là chuỗi hoặc số. Object lồng nhiều tầng thì dùng JSON (RedisJSON) hoặc tách key.",
      ],
      trap: {
        title: "Hash khổng lồ làm nghẽn",
        text: "`HGETALL` trên Hash có hàng triệu field tải hết về một lần, và Redis xử lý trên một luồng nên chặn các lệnh khác. Cách xử lý nằm ở phần big key bên dưới.",
      },
      quiz: {
        question: "Khi nào Hash tốt hơn lưu cả object thành một chuỗi JSON?",
        options: [
          "Khi hay đọc hoặc sửa từng field riêng lẻ",
          "Khi object lồng nhiều tầng",
          "Khi object rất nhỏ",
          "Khi cần mã hoá",
        ],
        answer: 0,
        explain: "Hash cho thao tác theo field (`HGET`, `HINCRBY`) mà không phải đọc ghi cả object.",
      },
      parts: [
        {
          id: "big-key",
          title: "Big key: một key khổng lồ làm Redis đứng",
          intro: [
            "Hash gom nhiều field vào một key rất tiện, tới khi một key chứa hàng triệu field. Redis chạy các lệnh trên **một luồng chính**, nên một lệnh chậm chặn mọi client khác.",
            "Với **big key** (hash, set, list, zset hàng triệu phần tử hoặc hàng trăm MB), vài lệnh trở thành nguy hiểm:",
            "- **`DEL`** trên key lớn giải phóng bộ nhớ ngay trên luồng chính, nên cả Redis đứng.",
            "- **`HGETALL`, `SMEMBERS`, `LRANGE 0 -1`** kéo toàn bộ key về: tốn băng thông và chặn luồng chính.",
            "Cách xử lý:",
            "- **`UNLINK`** thay `DEL`: gỡ key khỏi keyspace ngay, giải phóng bộ nhớ ở luồng nền.",
            "- Duyệt từng phần bằng `HSCAN`, `SSCAN`, `ZSCAN` thay vì đọc cả key.",
            "- **Chia nhỏ** key theo bucket, ví dụ `cart:{userId}:{n}` thay vì một hash khổng lồ.",
            "- Tìm big key bằng `redis-cli --bigkeys` hoặc `MEMORY USAGE <key>`.",
          ],
          widgetTitle: "Xoá một hash 2.000.000 field",
          compare: [
            way(
              "DEL",
              `DEL bigA        # hash 2.000.000 field`,
              [
                ask("Thời gian xoá", bad("Đã chạy: khoảng 0,9 giây trên máy tác giả (gồm cả thời gian chạy `redis-cli`). `LATENCY LATEST` ghi nhận một sự kiện `command` 924 ms: trong thời gian đó Redis không trả lời client nào.")),
              ],
              "Giải phóng bộ nhớ diễn ra trên luồng chính.",
            ),
            way(
              "UNLINK",
              `UNLINK bigB     # cùng cấu trúc, 2.000.000 field`,
              [
                ask("Thời gian xoá", ok("Đã chạy: khoảng 8 ms (gồm cả thời gian chạy `redis-cli`). Key biến mất khỏi keyspace ngay, bộ nhớ được giải phóng ở luồng nền.")),
                ask("Tìm key này từ đầu", ok("Đã chạy: `redis-cli --bigkeys` báo `Biggest hash found \"bigA\" has 2000000 fields`; `MEMORY USAGE` ra khoảng 106,5 triệu byte (gần 102 MiB).")),
              ],
              "Cùng dữ liệu, cùng kết quả, nhưng không chặn Redis.",
            ),
          ],
          after: [
            "Đã chạy trên Redis 8.6.2, một máy, hai hash cùng cấu trúc (mỗi hash 2.000.000 field), không bật lưu đĩa. Thời gian cụ thể phụ thuộc máy; điều cần nhớ là hiệu số giữa chặn và không chặn.",
          ],
          takeaway: {
            lines: [
              "Redis một luồng chính: big key + `DEL` hoặc `HGETALL` là đứng cả hệ thống. Xoá bằng `UNLINK`, đọc bằng `*SCAN`, và chia nhỏ key từ đầu.",
            ],
          },
          quiz: {
            question: "Cần xoá một set 5 triệu phần tử trên Redis đang phục vụ production. Cách an toàn nhất?",
            options: [
              "`DEL key`",
              "`UNLINK key`",
              "`FLUSHALL`",
              "`SMEMBERS key` rồi xoá từng phần tử ở ứng dụng",
            ],
            answer: 1,
            explain: "`UNLINK` gỡ key ngay và giải phóng bộ nhớ ở luồng nền. `DEL` giải phóng đồng bộ trên luồng chính nên chặn mọi client.",
          },
        },
      ],
    },
    {
      id: "zset",
      title: "Sorted Set: bảng xếp hạng",
      intro: [
        "Hash giữ một object, nhưng không có thứ tự giữa các object. Khi cần xếp hạng, dùng **Sorted Set (ZSET)**: tập hợp các phần tử, mỗi phần tử có một **điểm số**, luôn **sắp theo điểm**. Hợp với bảng xếp hạng, hàng đợi ưu tiên, cửa sổ thời gian.",
      ],
      widgetTitle: "Bảng xếp hạng người chơi",
      compare: [
        way(
          "Sắp xếp ở ứng dụng",
          `# điểm lưu trong database
SELECT user, score FROM scores;   -- tải hết về
# sắp xếp trong Java, lấy top 3, tìm hạng của An`,
          [
            ask("Lấy top 3", bad("Tải toàn bộ dữ liệu rồi sắp xếp mỗi lần hỏi, tốn khi có hàng triệu người chơi.")),
            ask("Điểm thay đổi liên tục", bad("Mỗi lần đổi điểm phải sắp xếp lại hoặc ghi database.")),
          ],
          "Việc sắp xếp lặp lại ở ứng dụng.",
        ),
        way(
          "Sorted Set",
          `ZADD lb 120 an 300 binh 210 chi 50 dung
ZREVRANGE lb 0 2 WITHSCORES      # top 3
ZREVRANK lb an                   # hạng của An (từ 0)
ZINCRBY lb 200 an                # cộng điểm`,
          [
            ask("Lấy top 3", ok("Đã chạy: `binh 300, chi 210, an 120`. Redis giữ sẵn thứ tự.")),
            ask("Điểm thay đổi liên tục", ok("Đã chạy: `ZREVRANK lb an` ra `2`, sau `ZINCRBY lb 200 an` điểm là `320` và `an` lên đầu bảng.")),
          ],
          "Thứ tự luôn được giữ sẵn, truy vấn top N và hạng đều nhanh.",
        ),
      ],
      after: [
        "Dùng làm bảng xếp hạng, lịch hẹn giờ (điểm là mốc thời gian), và cửa sổ trượt cho rate limit (bài sau).",
      ],
      trap: {
        title: "Hạng bắt đầu từ 0",
        text: "`ZRANK` và `ZREVRANK` trả hạng tính từ **0**. Hiển thị cho người dùng thì cộng 1.",
      },
      quiz: {
        question: "Muốn lấy 10 người điểm cao nhất, dùng lệnh nào?",
        options: ["`ZREVRANGE lb 0 9 WITHSCORES`", "`GET lb`", "`HGETALL lb`", "`SMEMBERS lb`"],
        answer: 0,
        explain: "ZSET giữ sẵn thứ tự theo điểm, `ZREVRANGE` lấy từ cao xuống thấp.",
      },
    },
    {
      id: "counting",
      title: "Set và HyperLogLog: đếm người dùng duy nhất",
      intro: [
        "Sorted Set xếp hạng theo điểm. Bài toán khác: đếm có bao nhiêu người dùng **khác nhau**. **Set** chứa các phần tử **không trùng**, có phép giao, hợp (`SINTER`, `SUNION`). Đếm chính xác nhưng **tốn bộ nhớ** theo số phần tử.",
        "**HyperLogLog** đếm số phần tử khác nhau **gần đúng** (sai số khoảng 1%) với bộ nhớ **cố định** vài KB.",
      ],
      predict: {
        question: "Đếm 10.000 người dùng duy nhất. Set tốn khoảng 535.590 byte. HyperLogLog tốn khoảng bao nhiêu?",
        options: ["Cũng khoảng 535 KB", "Khoảng 12,8 KB", "Khoảng 5 MB", "Gần 0 byte"],
        answer: 1,
        explain: "HyperLogLog dùng bộ nhớ cố định vài KB, không tăng theo số phần tử. Đổi lại kết quả là gần đúng.",
      },
      widgetTitle: "Đếm 10.000 người dùng duy nhất",
      compare: [
        way(
          "Set (chính xác)",
          `SADD visitors user1 user2 ...
SCARD visitors                    # đếm
SINTER v:mon v:tue                # ai vào cả hai ngày`,
          [
            ask("10.000 người dùng", bad("Đã chạy: tốn khoảng **535.590 byte** bộ nhớ. Số người dùng gấp 100 lần thì bộ nhớ cũng gấp 100 lần.")),
            ask("Ai vào cả hai ngày", ok("Đã chạy: `SINTER` ra `u2 u3`, `SUNION` ra `u1 u2 u3 u4`. Set làm được phép giao và hợp chính xác.")),
          ],
          "Chính xác và có phép giao, nhưng bộ nhớ tăng theo số phần tử.",
        ),
        way(
          "HyperLogLog (gần đúng)",
          `PFADD hll user1 user2 ...
PFCOUNT hll`,
          [
            ask("10.000 người dùng", ok("Đã chạy: `PFCOUNT` ra **10067** (sai số khoảng 0,7%), chỉ tốn khoảng **12.832 byte**, nhỏ hơn Set khoảng 40 lần.")),
            ask("Cần danh sách người dùng cụ thể", bad("Không có: HyperLogLog chỉ cho biết số lượng, không liệt kê được phần tử.")),
          ],
          "Rẻ và cố định bộ nhớ, đổi lại là gần đúng và không liệt kê được.",
        ),
      ],
      after: [
        "Chọn theo nhu cầu: cần danh sách hay cần giao hợp thì Set. Chỉ cần con số lớn như số người xem duy nhất mỗi ngày thì HyperLogLog.",
      ],
      trap: {
        title: "Dùng HyperLogLog khi cần số chính xác",
        text: "Số tiền, số đơn hàng hay bất cứ thứ gì phải khớp tuyệt đối thì không dùng xấp xỉ. HyperLogLog chỉ hợp với thống kê quy mô lớn.",
      },
      quiz: {
        question: "Cần đếm hàng chục triệu lượt xem duy nhất mỗi ngày với bộ nhớ nhỏ, chấp nhận sai số khoảng 1%. Dùng gì?",
        options: ["HyperLogLog", "Set", "List", "Hash"],
        answer: 0,
        explain: "HyperLogLog dùng bộ nhớ cố định (vài KB). Đã chạy: 10.000 phần tử chỉ tốn khoảng 12,8 KB so với 535 KB của Set.",
      },
    },
    {
      id: "stream",
      title: "Pub/Sub và Stream: truyền thông điệp",
      intro: [
        "Các cấu trúc trước lưu dữ liệu. Còn khi cần chuyển thông điệp từ service này sang worker khác, Redis có hai cách:",
        "- **Pub/Sub**: như phát thanh, người nghe đang online mới nhận được, **không lưu lại** gì.",
        "- **Stream**: nhật ký **có lưu**, hỗ trợ **consumer group** để chia việc, xác nhận (`XACK`) và đọc lại.",
      ],
      widgetTitle: "Gửi đơn hàng cho worker",
      compare: [
        way(
          "Pub/Sub",
          `PUBLISH news "hello"      # trả về số người đang nghe`,
          [
            ask("Chưa có ai đang nghe", bad("Đã chạy: `PUBLISH` ra `0`. Thông điệp **biến mất**, không ai nhận được và không lưu lại.")),
            ask("Worker khởi động chậm", bad("Thông điệp gửi trước khi worker online sẽ mất.")),
          ],
          "Nhanh và nhẹ, nhưng mất thông điệp nếu không có ai đang nghe.",
        ),
        way(
          "Stream và consumer group",
          `XADD orders * id 1 total 100
XADD orders * id 2 total 250
XGROUP CREATE orders workers 0
XREADGROUP GROUP workers w1 COUNT 1 STREAMS orders >
XACK orders workers <id>`,
          [
            ask("Chưa có ai đang nghe", ok("Đã chạy: `XADD` lưu lại, `XLEN orders` ra `2`. Worker đến sau vẫn đọc được.")),
            ask("Worker xử lý xong hay chưa", ok("Đã chạy: sau `XREADGROUP`, `XPENDING` ra `1` thông điệp chưa xác nhận. Sau `XACK` còn `0`. Worker chết giữa chừng thì thông điệp vẫn ở trạng thái pending để xử lý lại.")),
          ],
          "Có lưu, có chia việc theo nhóm, có xác nhận.",
        ),
      ],
      after: [
        "Hàng đợi đơn giản hơn nữa thì dùng **List**: `RPUSH jobs a b c` thêm vào cuối, `LPOP jobs` lấy từ đầu, nên vào trước ra trước. Đã chạy: `RPUSH` ra `3`, hai lần `LPOP` ra `a` rồi `b`, `LLEN` còn `1`. Đổi lại List không có consumer group hay xác nhận: worker lấy ra rồi chết là mất việc đó.",
        "Cần độ bền và tính năng phong phú (nhiều partition, giữ lâu, replay lớn) thì Kafka phù hợp hơn. Stream hợp cho hàng đợi nhẹ ngay trong hạ tầng Redis đã có.",
      ],
      takeaway: {
        lines: ["Thông điệp không được mất thì dùng Stream (hoặc Kafka). Pub/Sub chỉ hợp khi mất một thông điệp cũng không sao."],
      },
      trap: {
        title: "Dùng Pub/Sub cho việc không được mất",
        text: "Việc quan trọng như đơn hàng, thanh toán không nên đi qua Pub/Sub. Dùng Stream (hoặc Kafka) để có lưu trữ và xác nhận.",
      },
      quiz: {
        question: "Vì sao Pub/Sub không hợp để truyền đơn hàng cần xử lý chắc chắn?",
        options: [
          "Vì thông điệp không được lưu, ai không đang nghe sẽ mất",
          "Vì nó chậm",
          "Vì nó chỉ dùng được một subscriber",
          "Vì nó cần Lua",
        ],
        answer: 0,
        explain: "Đã chạy: `PUBLISH` khi chưa có người nghe trả `0` và thông điệp mất. Stream thì lưu lại.",
      },
    },
    {
      id: "chon-cau-truc",
      title: "Bài tập: bài toán này dùng cấu trúc nào?",
      intro: ["Mỗi dòng là một bài toán. Chọn cấu trúc Redis phù hợp nhất."],
      widgetTitle: "Chọn cấu trúc dữ liệu",
      drill: {
        choices: ["String", "Hash", "List", "Set", "Sorted Set", "HyperLogLog", "Stream"],
        summary: "Nhìn thao tác cần có: tăng nguyên tử, theo field, FIFO, không trùng, xếp hạng, đếm xấp xỉ, hay nhật ký có xác nhận.",
        items: [
          { q: "Đếm lượt xem một bài viết, nhiều request cùng lúc.", a: "String", why: "`INCR` nguyên tử trên một khoá." },
          { q: "Hồ sơ người dùng gồm tên, tuổi, thành phố, hay sửa từng trường.", a: "Hash", why: "Thao tác theo từng field." },
          { q: "Hàng đợi công việc đơn giản, vào trước ra trước.", a: "List", why: "`RPUSH` và `LPOP`." },
          { q: "Danh sách bài viết mà người dùng đã thích, không trùng, cần kiểm tra thành viên nhanh.", a: "Set", why: "Phần tử duy nhất, `SISMEMBER`." },
          { q: "Bảng xếp hạng người chơi cập nhật điểm liên tục.", a: "Sorted Set", why: "Giữ sẵn thứ tự theo điểm." },
          { q: "Đếm hàng chục triệu người xem duy nhất mỗi ngày với bộ nhớ nhỏ.", a: "HyperLogLog", why: "Bộ nhớ cố định, sai số khoảng 1%." },
          { q: "Nhật ký đơn hàng nhiều worker cùng xử lý, không được mất và có xác nhận.", a: "Stream", why: "Consumer group, `XACK`, thông điệp pending." },
        ],
      },
    },
  ],
  cards: [
    { q: "Vì sao dùng INCR thay vì GET rồi SET?", a: "INCR nguyên tử trên server. GET rồi SET là hai bước, nhiều client ghi đè nhau (đo: 4 client x 2000 lần ra 2781 thay vì 8000)." },
    { q: "Khi nào dùng Hash?", a: "Object có nhiều field, hay đọc hay sửa từng field (HGET, HINCRBY). Không lồng nhiều tầng, và tránh HGETALL trên Hash khổng lồ." },
    { q: "Sorted Set dùng cho gì?", a: "Bảng xếp hạng, hàng đợi ưu tiên, cửa sổ thời gian. Thứ tự luôn được giữ sẵn: ZADD, ZREVRANGE, ZREVRANK (hạng bắt đầu từ 0)." },
    { q: "Set khác HyperLogLog thế nào?", a: "Set chính xác, liệt kê và giao hợp được nhưng bộ nhớ tăng theo số phần tử (10.000 người ~ 535 KB). HyperLogLog gần đúng (~1%) với bộ nhớ cố định (~12,8 KB), chỉ cho số lượng." },
    { q: "Pub/Sub khác Stream thế nào?", a: "Pub/Sub không lưu, ai không nghe sẽ mất thông điệp (PUBLISH trả 0). Stream có lưu, consumer group, XACK, và pending để xử lý lại." },
    { q: "Nên dùng Redis Stream hay Kafka?", a: "Stream hợp cho hàng đợi nhẹ khi đã có Redis. Cần độ bền cao, nhiều partition, lưu lâu và replay lớn thì dùng Kafka." },
  ],
  modelAnswer:
    "Em chọn cấu trúc Redis theo thao tác cần có. Bộ đếm dùng INCR vì nó nguyên tử, GET rồi SET ở ứng dụng thì các client ghi đè nhau. Object dùng Hash để sửa từng field. Bảng xếp hạng dùng Sorted Set vì thứ tự được giữ sẵn. Đếm duy nhất chính xác dùng Set, còn đếm hàng chục triệu thì dùng HyperLogLog với bộ nhớ cố định và sai số khoảng 1%. Truyền thông điệp không được mất thì dùng Stream với consumer group và XACK, không dùng Pub/Sub vì thông điệp không được lưu.",
};
