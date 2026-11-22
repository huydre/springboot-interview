import type { Lesson } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every Java snippet and output below was run on JDK 21 (IoDemo.java with -Xmx64m on a 58 MB file, Mask.java, and a two-version Person class serialized then read back).
export const javaIo: Lesson = {
  slug: "java-io",
  crumb: "I/O, Charset, Serialization",
  videoDir: "/videos/java-io",
  videoVersion: "0",
  scenes: [],
  title: "I/O, Charset và Serialization",
  subtitle:
    "Đọc ghi file và stream đúng cách: try-with-resources, charset, file lớn, ByteBuffer, và những bẫy của Java Serialization mà người phỏng vấn hay hỏi.",
  openingQuiz: {
    question: "Trong `try { ... } finally { r.close(); }`, nếu cả thân `try` lẫn `close()` đều ném exception, exception nào bạn thấy?",
    options: [
      "Exception của thân `try`",
      "Exception của `close()`, exception gốc bị mất",
      "Cả hai cùng được báo",
      "Không có exception nào",
    ],
    answer: 1,
    explain: "Đã chạy: `finally` ném `close failed` và che mất `work failed`. `try-with-resources` giữ exception gốc và gắn lỗi của `close()` vào `getSuppressed()`.",
  },
  roadmap: [
    "Chặng 1: try-with-resources và charset. Đóng tài nguyên đúng, và đọc chữ tiếng Việt không bị vỡ.",
    "Chặng 2: file lớn và `ByteBuffer`. Đọc theo luồng, và cái bẫy `flip()`.",
    "Chặng 3: Serialization. `transient`, `serialVersionUID` và rủi ro bảo mật.",
  ],
  sections: [
    {
      id: "twr",
      title: "try-with-resources: đóng tài nguyên không mất lỗi gốc",
      intro: [
        "Mọi tài nguyên cần đóng (file, kết nối, stream) nên dùng **try-with-resources**. Nó tự gọi `close()` theo thứ tự **ngược với thứ tự khai báo**: mở A rồi B thì đóng B trước, vì B thường dựa trên A (ví dụ `Statement` dựa trên `Connection`).",
        "Nó còn **giữ exception gốc**. Nếu `close()` cũng lỗi, lỗi đó trở thành một **suppressed exception**: một exception phụ được gắn vào exception chính, lấy ra bằng `getSuppressed()`, thay vì đè mất exception chính.",
      ],
      widgetTitle: "Thân try lỗi và close() cũng lỗi",
      compare: [
        way(
          "try / finally",
          `try {
  throw new RuntimeException("work failed");
} finally {
  r.close();                  // close() cũng ném exception
}`,
          [
            ask("Cả thân try và close() đều lỗi", bad("Đã chạy: bạn chỉ thấy `close failed`. Exception gốc `work failed` **bị mất**, rất khó tìm nguyên nhân.")),
            ask("Nhiều tài nguyên", bad("Phải tự lồng nhiều `try/finally` và tự đóng đúng thứ tự.")),
          ],
          "Lỗi của `close()` đè lên lỗi thật sự.",
        ),
        way(
          "try-with-resources",
          `try (Res r = new Res()) {
  throw new RuntimeException("work failed");
}`,
          [
            ask("Cả thân try và close() đều lỗi", ok("Đã chạy: exception thấy được là `work failed`, và lỗi `close failed` nằm trong `getSuppressed()`.")),
            ask("Nhiều tài nguyên", ok("Khai báo nhiều tài nguyên trong ngoặc, Java tự đóng theo thứ tự ngược.")),
          ],
          "Không mất lỗi gốc, và code gọn hơn.",
        ),
      ],
      after: [
        "Tài nguyên phải implement `AutoCloseable`. Dùng cho `InputStream`, `Connection`, `Statement`, `Scanner`, và cả class của riêng bạn.",
      ],
      trap: {
        title: "Quên đóng, hoặc đóng sai chỗ",
        text: "Quên đóng làm rò file descriptor và kết nối. Hãy mặc định dùng try-with-resources cho mọi thứ implement `AutoCloseable`, không viết `finally` tay.",
      },
      quiz: {
        question: "Với try-with-resources, nếu cả thân và `close()` ném exception, exception nào được ném ra?",
        options: [
          "Của `close()`",
          "Của thân try, còn lỗi của `close()` nằm trong suppressed",
          "Không exception nào",
          "Cả hai bị bỏ",
        ],
        answer: 1,
        explain: "Đã chạy: `thrown: work failed | suppressed: close failed`.",
      },
    },
    {
      id: "charset",
      title: "Charset: chữ tiếng Việt bị vỡ vì đâu",
      intro: [
        "Máy tính lưu **byte**, **charset** quyết định byte nào là chữ nào. Đọc byte UTF-8 bằng charset sai sẽ ra chữ vỡ ({{mojibake|mojibake}}).",
        "Từ JDK 18, charset mặc định là **UTF-8** trên mọi hệ điều hành. Trước JDK 18, charset mặc định lấy theo hệ điều hành, ví dụ Windows tiếng Anh là `cp1252` (bảng mã 1 byte cho chữ Latin của Windows, không có chữ tiếng Việt có dấu).",
      ],
      widgetTitle: "Đọc \"Việt Nam\" bằng hai charset",
      compare: [
        way(
          "Không chỉ rõ charset",
          `new String(bytes);                 // dùng charset mặc định của máy
new FileReader("a.txt");           // cũng vậy (trước JDK 18)`,
          [
            ask("Bản Java cũ trên Windows", bad("Charset mặc định có thể là cp1252: cùng file cho ra chữ khác nhau tuỳ máy.")),
            ask("Đọc nhầm charset", bad("Đã chạy: byte UTF-8 của \"Việt Nam\" đọc bằng ISO-8859-1 ra `Viá»t Nam`.")),
          ],
          "Kết quả phụ thuộc môi trường chạy.",
        ),
        way(
          "Luôn chỉ rõ UTF-8",
          `new String(bytes, StandardCharsets.UTF_8);
Files.readString(path, StandardCharsets.UTF_8);`,
          [
            ask("Chạy trên mọi máy", ok("Cùng file, cùng kết quả ở mọi nơi. Đã chạy: ra `Việt Nam`.")),
            ask("Chữ có dấu chiếm bao nhiêu byte", ok("Đã chạy: 8 ký tự \"Việt Nam\" chiếm **10 byte** trong UTF-8, vì chữ `ệ` cần 3 byte. Đừng đổi byte thành ký tự rồi đếm lẫn nhau.")),
          ],
          "Chỉ rõ charset thì kết quả không phụ thuộc máy.",
        ),
      ],
      after: [
        "Độ dài `String` (`length()`) đếm ký tự, còn độ dài byte phụ thuộc charset. Khi giới hạn kích thước (cột database, header), hãy đếm byte đúng charset.",
      ],
      trap: {
        title: "Dựa vào charset mặc định",
        text: "Dù JDK 18+ đã mặc định UTF-8, code cần chạy trên nhiều phiên bản và nhiều nguồn dữ liệu vẫn nên chỉ rõ `StandardCharsets.UTF_8`.",
      },
      quiz: {
        question: "Đọc byte UTF-8 của chữ \"Việt\" bằng ISO-8859-1 thì ra gì?",
        options: ["Chữ vỡ như `Viá»t`", "Chữ đúng", "Exception", "Chuỗi rỗng"],
        answer: 0,
        explain: "ISO-8859-1 hiểu mỗi byte là một ký tự riêng, nên ký tự dùng nhiều byte trong UTF-8 (như `ệ` cần 3 byte) bị tách thành nhiều ký tự lạ.",
      },
    },
    {
      id: "big-file",
      title: "File lớn: đọc theo luồng, đừng nạp hết vào bộ nhớ",
      intro: [
        "`Files.readAllLines` nạp **toàn bộ file** vào bộ nhớ. `Files.lines` trả về một `Stream` đọc **từng dòng khi cần**.",
        "Nhớ **đóng** `Stream` của `Files.lines` bằng try-with-resources.",
      ],
      widgetTitle: "File 58 MB (3 triệu dòng) với heap 64 MB",
      compare: [
        way(
          "readAllLines",
          `List<String> lines = Files.readAllLines(path);   // cả file nằm trong RAM`,
          [
            ask("File 58 MB với -Xmx64m", bad("Đã chạy: `OutOfMemoryError (Java heap space)`. Mỗi dòng là một `String` nên tốn nhiều hơn kích thước file.")),
          ],
          "Dùng bộ nhớ tỷ lệ với kích thước file.",
        ),
        way(
          "Files.lines (stream)",
          `try (Stream<String> s = Files.lines(path)) {
  long n = s.count();                    // đọc từng dòng, không giữ lại
}`,
          [
            ask("File 58 MB với -Xmx64m", ok("Đã chạy: đếm đúng **3000000** dòng trong cùng giới hạn bộ nhớ.")),
            ask("Chỉ cần vài dòng đầu", ok("Đã chạy: `limit(2)` chỉ đọc 2 dòng đầu `[line number 0, line number 1]`, không đọc cả file.")),
          ],
          "Bộ nhớ gần như cố định, không phụ thuộc kích thước file.",
        ),
      ],
      after: [
        "Với dữ liệu thật lớn, đọc theo khối bằng `BufferedReader` hoặc `FileChannel`, và ghi bằng `BufferedWriter`. Luôn nghĩ: dữ liệu có thể lớn hơn RAM không?",
        "Hai họ class cần phân biệt: **byte stream** (`InputStream`, `OutputStream`) đọc ghi byte thô, dùng cho ảnh, file nén; **char stream** (`Reader`, `Writer`) đọc ghi ký tự, nên cần charset. `InputStreamReader` là cầu nối: nhận byte, giải mã bằng charset thành ký tự.",
        "`BufferedReader` bọc ngoài một `Reader` khác (mẫu decorator): `new BufferedReader(new InputStreamReader(in, UTF_8))`. Nó đọc một khối lớn mỗi lần thay vì gọi hệ điều hành cho từng ký tự, nên nhanh hơn nhiều.",
      ],
      trap: {
        title: "Quên đóng Stream của Files.lines",
        text: "`Files.lines` giữ file mở cho tới khi stream được đóng. Không dùng try-with-resources thì rò file descriptor.",
      },
      quiz: {
        question: "Vì sao `Files.readAllLines` gây `OutOfMemoryError` với file lớn?",
        options: [
          "Vì nó nạp toàn bộ nội dung file vào bộ nhớ",
          "Vì nó đọc chậm",
          "Vì nó dùng nhiều thread",
          "Vì nó tự khoá file",
        ],
        answer: 0,
        explain: "Đã chạy: file 58 MB với heap 64 MB ném `Java heap space`, trong khi `Files.lines().count()` vẫn đếm được 3 triệu dòng.",
      },
    },
    {
      id: "bytebuffer",
      title: "ByteBuffer và cái bẫy flip()",
      intro: [
        "NIO (New I/O, gói `java.nio`) đọc ghi qua **channel**: một kênh nối tới file hay socket, mỗi lần đọc hay ghi cả một khối byte vào một buffer. Buffer đó là `ByteBuffer`, có ba con số: **position** (vị trí hiện tại), **limit** (giới hạn) và **capacity** (sức chứa). Ghi dữ liệu vào làm tăng `position`.",
        "Muốn đọc lại thứ vừa ghi phải gọi **`flip()`**: đặt `limit` bằng chỗ đã ghi và `position` về 0.",
      ],
      widgetTitle: "Ghi 3 byte rồi đọc lại",
      compare: [
        way(
          "Quên flip()",
          `ByteBuffer buf = ByteBuffer.allocate(16);
buf.put((byte) 1).put((byte) 2).put((byte) 3);
buf.get();       // đọc ở đâu?`,
          [
            ask("Đọc ngay sau khi ghi", bad("Đã chạy: sau `put` thì `position=3, limit=16, remaining=13`. `get()` đọc ô ở vị trí 3, là ô **chưa ghi**, nên ra `0` và `position` tăng lên 4. Không lỗi gì, chỉ âm thầm đọc sai vùng: vùng `position..limit` là 13 ô trống, không phải 3 byte vừa ghi.")),
          ],
          "Buffer đang ở chế độ ghi nhưng bạn đọc.",
        ),
        way(
          "flip() trước khi đọc",
          `buf.flip();      // chuyển từ chế độ ghi sang chế độ đọc
buf.get();`,
          [
            ask("Đọc sau khi flip", ok("Đã chạy: `position=0, limit=3, remaining=3`, đọc đúng 3 byte vừa ghi.")),
            ask("Ghi tiếp sau khi đọc xong", ok("Gọi `clear()` (xoá hết) hoặc `compact()` (giữ phần chưa đọc) để quay về chế độ ghi.")),
          ],
          "Mỗi lần đổi chiều ghi và đọc đều cần `flip()`, `clear()` hay `compact()`.",
        ),
      ],
      after: [
        "NIO còn có `FileChannel.transferTo` để chép giữa các kênh mà không đưa dữ liệu qua bộ nhớ của ứng dụng (zero-copy ở mức hệ điều hành). Dùng khi gửi file lớn.",
      ],
      trap: {
        title: "Quên chuyển chế độ",
        text: "Hầu hết lỗi `ByteBuffer` là quên `flip()` (âm thầm đọc vùng chưa ghi, ra byte `0` hoặc dữ liệu cũ) hoặc quên `clear()` (không ghi tiếp được). Hãy nhớ: ghi xong thì flip, đọc xong thì clear.",
      },
      quiz: {
        question: "Sau khi `put` 3 byte vào buffer dung lượng 16, `flip()` làm gì?",
        options: [
          "Đặt `limit = 3` và `position = 0` để đọc lại 3 byte",
          "Xoá buffer",
          "Tăng `capacity`",
          "Đảo thứ tự byte",
        ],
        answer: 0,
        explain: "Đã chạy: trước flip `position=3, limit=16`. Sau flip `position=0, limit=3`.",
      },
    },
    {
      id: "serialization",
      title: "Java Serialization: transient, serialVersionUID và bảo mật",
      intro: [
        "`Serializable` biến object thành byte. Nhớ ba điều: field **`transient`** không được lưu, **`serialVersionUID`** quyết định phiên bản có tương thích không, và đọc dữ liệu **không tin cậy** là nguy hiểm.",
        "Vì sao thêm field làm hỏng dữ liệu cũ: nếu bạn không khai báo `serialVersionUID`, Java tự tính nó bằng một **hash của cấu trúc class** (tên, field, method). Thêm một field là hash đổi, và lúc đọc Java so hai số này: khác nhau thì từ chối.",
        "Vì sao đọc dữ liệu lạ nguy hiểm: khi deserialize, Java tạo object của bất kỳ class nào ghi trong byte, miễn class đó có trên classpath, và gọi `readObject` của nó. Kẻ tấn công ghép các class có sẵn trong thư viện (gọi là **gadget chain**) để `readObject` của chúng nối nhau chạy lệnh tuỳ ý.",
      ],
      widgetTitle: "Lưu Person rồi thêm một field",
      compare: [
        way(
          "Serializable mặc định",
          `class Person implements Serializable {
  String name = "An";
  transient String password = "secret";   // không được lưu
}`,
          [
            ask("Thêm một field vào class rồi đọc file cũ", bad("Đã chạy (ghi bằng class cũ, thêm field `int age` rồi đọc lại): `InvalidClassException: Person; local class incompatible: stream classdesc serialVersionUID = 3778188202762978657, local class serialVersionUID = -2587110379539063025`. Hai số khác nhau nên phiên bản cũ không đọc được.")),
            ask("Đọc dữ liệu từ nguồn không tin cậy", bad("Deserialization tạo object của bất kỳ class nào trên classpath và chạy `readObject` của chúng. Qua gadget chain, kẻ tấn công có thể chạy lệnh tuỳ ý: đây là nguồn của nhiều lỗ hổng bảo mật.")),
          ],
          "Phiên bản được tính tự động nên đổi class là hỏng dữ liệu cũ.",
        ),
        way(
          "serialVersionUID rõ ràng và bộ lọc",
          `private static final long serialVersionUID = 1L;
in.setObjectInputFilter(ObjectInputFilter.Config.createFilter("com.myapp.*;!*"));`,
          [
            ask("Thêm một field vào class rồi đọc file cũ", ok("Đã chạy: đọc được, field mới nhận giá trị mặc định. Ví dụ `name=An`.")),
            ask("Bộ lọc từ chối class không cho phép", ok("Mẫu `com.myapp.*;!*` nghĩa là: cho phép class trong gói `com.myapp`, từ chối mọi class khác. Đã chạy: `InvalidClassException: filter status: REJECTED`.")),
            ask("Field transient sau khi đọc lại", ok("Đã chạy: `password=null`. Field `transient` không được ghi ra byte nên không bị lộ.")),
          ],
          "Khai báo phiên bản rõ ràng và chỉ cho phép các class mong đợi.",
        ),
      ],
      after: [
        "Với lưu trữ và API, ưu tiên **JSON** hoặc Protobuf: rõ ràng, độc lập ngôn ngữ, không tạo object tuỳ ý. Java Serialization chủ yếu còn ở mã cũ và vài thư viện (session, cache phân tán).",
      ],
      trap: {
        title: "Không khai báo serialVersionUID",
        text: "Sửa class (thêm field, đổi method) làm giá trị tự tính đổi theo, vì nó là một hash của cấu trúc class, và dữ liệu đã lưu không đọc lại được. Luôn khai báo `serialVersionUID` tường minh nếu dùng Serializable.",
      },
      quiz: {
        question: "Field `transient` có ý nghĩa gì khi serialize?",
        options: [
          "Field không được ghi vào byte, nên sau khi đọc lại sẽ có giá trị mặc định",
          "Field được mã hoá",
          "Field chỉ đọc",
          "Field tự cập nhật",
        ],
        answer: 0,
        explain: "Đã chạy: `password` là `transient` nên đọc lại ra `null`.",
      },
    },
    {
      id: "bang-nho",
      title: "Bảng nhớ I/O",
      intro: ["Bấm từng dòng để xem câu nên nói ra miệng."],
      widgetTitle: "Bảng nhớ",
      cheat: [
        { name: "try-with-resources", one: "Đóng tài nguyên, giữ lỗi gốc.", say: "Em dùng try-with-resources thay cho try/finally. Nếu cả thân và close() lỗi thì exception gốc được giữ, lỗi của close() nằm trong getSuppressed()." },
        { name: "Charset", one: "Luôn chỉ rõ UTF-8.", say: "Byte và ký tự liên hệ qua charset. Em luôn chỉ rõ StandardCharsets.UTF_8 để không phụ thuộc máy. JDK 18 trở đi mặc định UTF-8 nhưng em vẫn chỉ rõ." },
        { name: "File lớn", one: "Đọc theo luồng.", say: "Files.readAllLines nạp cả file vào RAM nên file lớn gây OutOfMemoryError. Em dùng Files.lines với try-with-resources, bộ nhớ gần như cố định." },
        { name: "ByteBuffer", one: "flip() để đổi sang chế độ đọc.", say: "Buffer có position, limit, capacity. Ghi xong phải flip() mới đọc được, đọc xong thì clear() hoặc compact() để ghi tiếp." },
        { name: "Serialization", one: "transient, serialVersionUID, bộ lọc.", say: "Em khai báo serialVersionUID tường minh, dùng transient cho dữ liệu nhạy cảm và ObjectInputFilter khi đọc dữ liệu ngoài. Với API và lưu trữ em ưu tiên JSON." },
      ],
      quiz: {
        question: "Bạn nhận dữ liệu object tuần tự hoá từ bên ngoài hệ thống. Nên làm gì?",
        options: [
          "Đọc thẳng bằng `ObjectInputStream`",
          "Tránh nếu được (dùng JSON), hoặc đặt `ObjectInputFilter` chỉ cho phép các class mong đợi",
          "Thêm `try/catch` bắt mọi lỗi",
          "Tăng kích thước heap",
        ],
        answer: 1,
        explain: "Deserialization dữ liệu không tin cậy là rủi ro bảo mật. Bộ lọc từ chối class lạ (đã chạy: `filter status: REJECTED`).",
      },
    },
  ],
  cards: [
    { q: "Vì sao try-with-resources tốt hơn try/finally?", a: "Giữ exception gốc: lỗi của close() nằm trong getSuppressed() thay vì đè mất. Tự đóng theo thứ tự ngược, code gọn hơn." },
    { q: "Charset mặc định của Java là gì?", a: "UTF-8 từ JDK 18 trên mọi hệ điều hành. Bản cũ phụ thuộc máy. Vẫn nên chỉ rõ StandardCharsets.UTF_8." },
    { q: "Vì sao 8 ký tự 'Việt Nam' chiếm 10 byte?", a: "UTF-8 dùng độ dài thay đổi: chữ có dấu như ệ cần 3 byte. Độ dài String đếm ký tự, không phải byte." },
    { q: "Files.readAllLines khác Files.lines thế nào?", a: "readAllLines nạp cả file vào RAM (file 58 MB với heap 64 MB gây OutOfMemoryError). Files.lines đọc theo luồng, nhớ đóng bằng try-with-resources." },
    { q: "flip() làm gì?", a: "Đặt limit bằng position hiện tại và position về 0, chuyển buffer từ chế độ ghi sang chế độ đọc. Đọc xong dùng clear() hoặc compact()." },
    { q: "Rủi ro của Java Serialization?", a: "Thiếu serialVersionUID thì đổi class là InvalidClassException. Đọc dữ liệu không tin cậy có thể tạo object tuỳ ý (lỗ hổng). Dùng ObjectInputFilter hoặc JSON." },
  ],
  modelAnswer:
    "Em dùng try-with-resources để đóng tài nguyên và giữ exception gốc, lỗi của close() nằm trong suppressed. Em luôn chỉ rõ UTF-8 để chữ tiếng Việt không bị vỡ. Với file lớn em dùng Files.lines trong try-with-resources thay vì readAllLines để tránh OutOfMemoryError. Với ByteBuffer em nhớ flip() trước khi đọc. Với Serialization em khai báo serialVersionUID, dùng transient cho dữ liệu nhạy cảm, và đặt ObjectInputFilter khi đọc dữ liệu ngoài, còn lưu trữ và API em ưu tiên JSON.",
};
