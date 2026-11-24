import timeline from "../timelines/elasticsearch.json";
import type { Lesson, Scene } from "../types";
import { ask, bad, ok, way } from "./pattern-kit";

// Every request and response quoted in board code was run against Elasticsearch 8.15.3 (single node, security off,
// heap 512m) in Docker. Responses are trimmed with filter_path or shortened where marked. The Spring Data
// Elasticsearch snippet in the last section was not compiled or run.
export const elasticsearch: Lesson = {
  slug: "elasticsearch",
  crumb: "Elasticsearch",
  videoDir: "/videos/elasticsearch",
  videoVersion: "ee8596da",
  scenes: timeline as Scene[],
  title: "Elasticsearch cho Spring backend: từ inverted index tới đồng bộ dữ liệu",
  subtitle:
    "Analyzer và tiếng Việt bỏ dấu, `text` khác `keyword`, match khác term, filter context, BM25, phân trang sâu, shard và replica, near real-time, đồng bộ từ database qua outbox hoặc CDC, reindex không downtime bằng alias, và khi nào không nên dùng Elasticsearch.",
  openingQuiz: {
    question: "Field `status` kiểu `keyword` có giá trị `ACTIVE`. Query `{\"match\": {\"status\": \"active\"}}` trả về bao nhiêu kết quả?",
    options: [
      "Tất cả tài liệu ACTIVE, vì match luôn không phân biệt hoa thường",
      "0, vì field `keyword` không qua analyzer: lưu nguyên `ACTIVE`, và match trên keyword cũng so nguyên văn",
      "Báo lỗi vì không được match trên keyword",
      "Ngẫu nhiên tuỳ shard",
    ],
    answer: 1,
    explain:
      "Match dùng analyzer của field. Field `keyword` không có analyzer (chỉ có normalizer nếu bạn khai báo), nên `active` được so nguyên văn với `ACTIVE` và không khớp. Bài này chạy thật trên Elasticsearch 8.15: kết quả là 0 (Phần 2).",
  },
  roadmap: [
    "Chặng 1: inverted index và analyzer (có tiếng Việt bỏ dấu), so với PostgreSQL full-text; document, mapping, `text` và `keyword`.",
    "Chặng 2: match và term, bool query và filter context, BM25, phân trang sâu; shard, replica, near real-time và routing.",
    "Chặng 3: đồng bộ database sang Elasticsearch (outbox, CDC, version), reindex không downtime bằng alias; khi nào không dùng và Spring Data Elasticsearch.",
  ],
  sections: [
    {
      id: "inverted-index",
      scene: "inverted-index",
      title: "Phần 1: Inverted index và analyzer",
      intro: [
        "Bài System Design thực hành đã nói `LIKE '%x%'` đọc mọi dòng và không xếp hạng, còn full-text search dùng inverted index. Phần này đi sâu hơn: inverted index được tạo ra **từ đâu**, và vì sao cùng một câu chữ lại có thể tìm ra hay không tìm ra tuỳ cấu hình.",
        "**Inverted index** giống mục lục cuối sách: thay vì `tài liệu → nội dung`, nó lưu `từ → danh sách tài liệu chứa từ đó` (posting list), kèm vị trí và số lần xuất hiện để xếp hạng. Từ nào được ghi vào mục lục do **analyzer** quyết định. Analyzer là một dây chuyền ba bước:",
        "- **Character filter** (không bắt buộc): sửa chuỗi gốc trước khi tách, ví dụ bỏ thẻ HTML.",
        "- **Tokenizer** (đúng một cái): cắt chuỗi thành token. `standard` cắt theo ranh giới từ Unicode, nên tiếng Việt bị tách theo **âm tiết**: `điện`, `thoại`.",
        "- **Token filter** (không hoặc nhiều): biến đổi từng token. `lowercase` hạ chữ thường; `asciifolding` đổi ký tự có dấu về ASCII, kể cả `đ` thành `d`.",
        "Điểm then chốt: analyzer chạy **hai lần**, một lần lúc **index** tài liệu, một lần lúc **search** câu truy vấn (với query kiểu `match`). Hai bên phải ra cùng một dạng token thì mới khớp. Người dùng gõ `dien thoai` không dấu mà index chỉ có `điện` thì không bao giờ khớp, trừ khi cả hai bên cùng qua `asciifolding`.",
      ],
      predict: {
        question: "Gửi `Điện thoại Sạc Nhanh` qua analyzer `standard` mặc định. Token nào được sinh ra?",
        options: [
          "`Điện thoại Sạc Nhanh` (một token)",
          "`điện`, `thoại`, `sạc`, `nhanh` (chữ thường, vẫn giữ dấu)",
          "`dien`, `thoai`, `sac`, `nhanh` (bỏ dấu)",
          "`điện thoại`, `sạc nhanh` (theo từ ghép)",
        ],
        answer: 1,
        explain: "`standard` gồm tokenizer standard và filter lowercase, không có asciifolding. Nó tách theo khoảng trắng và ranh giới từ, không hiểu từ ghép tiếng Việt, và giữ nguyên dấu. Kết quả chạy thật ở thẻ 1 bên dưới.",
      },
      board: {
        title: "Analyzer quyết định từ nào vào index",
        highlight: "Analyzer",
        chips: ["_analyze API", "standard", "lowercase", "asciifolding"],
        cards: [
          {
            title: "Analyzer standard: chữ thường, vẫn giữ dấu",
            diagram: { kind: "pipe", from: "Điện thoại Sạc Nhanh", via: "standard + lowercase", to: "điện, thoại, sạc, nhanh", skipped: ["asciifolding"], skippedLabel: "Không bỏ dấu: gõ `dien thoai` sẽ không khớp" },
            code: `POST /_analyze
{ "analyzer": "standard", "text": "Điện thoại Sạc Nhanh" }

// Response thật (Elasticsearch 8.15.3), bỏ bớt offset:
{"tokens":[
  {"token":"điện","type":"<ALPHANUM>","position":0},
  {"token":"thoại","type":"<ALPHANUM>","position":1},
  {"token":"sạc","type":"<ALPHANUM>","position":2},
  {"token":"nhanh","type":"<ALPHANUM>","position":3}]}`,
            takeaway: "Tiếng Việt bị tách theo âm tiết, dấu còn nguyên",
          },
          {
            title: "Thêm asciifolding: tìm không dấu vẫn ra",
            diagram: { kind: "pipe", from: "Điện thoại Sạc Nhanh", via: "standard → lowercase → asciifolding", to: "dien, thoai, sac, nhanh", skipped: ["giữ dấu"], skippedLabel: "`đ` thành `d`, `ạ` thành `a`" },
            code: `POST /_analyze
{ "tokenizer": "standard",
  "filter": ["lowercase", "asciifolding"],
  "text": "Điện thoại Sạc Nhanh" }

// Response thật, bỏ bớt offset:
{"tokens":[
  {"token":"dien","position":0},
  {"token":"thoai","position":1},
  {"token":"sac","position":2},
  {"token":"nhanh","position":3}]}

// Đóng gói thành analyzer riêng của index:
"analysis": { "analyzer": { "vn_fold": {
  "type": "custom", "tokenizer": "standard",
  "filter": ["lowercase", "asciifolding"] } } }`,
            notes: ["Index và search cùng dùng `vn_fold`, nên người dùng gõ có dấu hay không dấu đều về cùng token."],
            takeaway: "Cùng analyzer ở hai đầu thì mới khớp",
          },
        ],
        conclusion: "**Kết luận:** muốn biết một câu sẽ tìm ra hay không, gọi `_analyze` với đúng analyzer của field và so token hai phía. Đây là cách debug đầu tiên khi \"search không ra\".",
      },
      after: [
        "Đổi lại, bỏ dấu làm mất nghĩa: `bán` và `bạn` cùng thành `ban`. Cách hay dùng là **multi-field**: một field con giữ dấu (khớp chính xác hơn, điểm cao hơn) và một field con bỏ dấu (bắt được khi gõ không dấu), query cả hai và cộng điểm (Phần 2 nói về multi-field).",
        "Còn tách từ ghép (`điện thoại` là một từ) thì cần plugin phân tích tiếng Việt riêng hoặc dùng `match_phrase` để yêu cầu các âm tiết đứng liền nhau đúng thứ tự.",
        "So với **PostgreSQL**: `tsvector` cũng là danh sách token đã chuẩn hoá, index GIN chính là một inverted index. Extension `unaccent` làm việc của asciifolding. `pg_trgm` thì khác: cắt chuỗi thành các cụm 3 ký tự (trigram), nên chịu được gõ sai nhẹ và giúp `LIKE '%x%'` dùng index, nhưng không có khái niệm analyzer theo ngôn ngữ. Postgres làm được phần lõi; Elasticsearch mạnh hơn ở analyzer tuỳ biến, fuzzy, xếp hạng BM25, aggregation nhiều chiều và scale ngang phần đọc.",
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Analyzer sinh token, token vào inverted index, query cũng qua analyzer, hai bên trùng token thì khớp.",
          "Tiếng Việt: `standard` giữ dấu; thêm `asciifolding` để gõ không dấu vẫn ra.",
        ],
      },
      trap: {
        title: "Đổi analyzer không áp dụng ngược cho dữ liệu cũ",
        text: "Token đã nằm trong index từ lúc ghi. Thêm `asciifolding` vào mapping của index đang chạy không làm tài liệu cũ có token không dấu; phải tạo index mới với analyzer mới rồi reindex (Phần 5).",
      },
      quiz: {
        question: "Người dùng gõ `sac nhanh` mà không ra sản phẩm \"Sạc Nhanh\". Nguyên nhân hợp lý nhất?",
        options: [
          "Elasticsearch không hỗ trợ tiếng Việt",
          "Field dùng analyzer không có `asciifolding`: index lưu `sạc`, query sinh `sac`, hai token khác nhau",
          "Cần tăng số shard",
          "Phải dùng `term` thay cho `match`",
        ],
        answer: 1,
        explain: "Khớp hay không là do token hai phía. `_analyze` sẽ cho thấy index có `sạc` còn query có `sac`. Thêm asciifolding vào analyzer (index mới, reindex) là cách sửa.",
      },
    },
    {
      id: "mapping",
      scene: "mapping",
      title: "Phần 2: Document, index, mapping và cái bẫy text với keyword",
      intro: [
        "Đã biết analyzer sinh token. Nhưng field nào qua analyzer, field nào không? Đó là việc của **mapping**.",
        "Ba khái niệm cơ bản, so với database quan hệ cho dễ hình dung (chỉ là so sánh gần đúng):",
        "- **Document**: một tài liệu JSON, có `_id`, giống một dòng. Ví dụ một sản phẩm.",
        "- **Index**: tập các document cùng cấu trúc, giống một bảng. Bên dưới được chia thành các shard (Phần 4).",
        "- **Mapping**: khai báo kiểu của từng field và cách index nó, giống schema của bảng.",
        "Hai kiểu chuỗi quan trọng nhất:",
        "- **`text`**: qua analyzer, sinh nhiều token, dùng cho **tìm kiếm toàn văn** (tên, mô tả). Không sort, không aggregation được theo mặc định.",
        "- **`keyword`**: **không** qua analyzer, cả chuỗi là một token nguyên văn, có doc values (lưu theo cột) nên dùng cho **lọc chính xác, sort, aggregation** (status, sku, email, tag).",
        "**Multi-field** cho một giá trị cả hai vai: `name` là `text` để tìm, `name.raw` là `keyword` để sort và lọc chính xác. Elasticsearch ghi cùng giá trị vào hai cấu trúc khác nhau.",
      ],
      board: {
        title: "Cùng một chuỗi, text và keyword cư xử khác hẳn",
        highlight: "text và keyword",
        chips: ["mapping", "multi-field", "term", "sort", "aggregation"],
        cards: [
          {
            title: "Mapping có multi-field",
            diagram: { kind: "hub", inputs: [{ label: "name: text (vn_fold)", mark: "plus" }, { label: "name.raw: keyword", mark: "plus" }, { label: "status: keyword", mark: "plus" }, { label: "price: long", mark: "plus" }], center: "products", rulesTitle: "Dùng để", rules: ["`name`: match, tìm toàn văn", "`name.raw`: sort, term chính xác", "`status`: filter, aggregation"] },
            code: `PUT /products
{ "settings": { "number_of_shards": 1, "number_of_replicas": 0,
    "analysis": { "analyzer": { "vn_fold": { "type": "custom",
      "tokenizer": "standard", "filter": ["lowercase", "asciifolding"] } } } },
  "mappings": { "properties": {
    "name":   { "type": "text", "analyzer": "vn_fold",
                "fields": { "raw": { "type": "keyword" } } },
    "status": { "type": "keyword" },
    "price":  { "type": "long" } } } }

// 3 tài liệu: 1 "Điện thoại Sạc Nhanh" ACTIVE, 2 "Sạc dự phòng 20000mAh" ACTIVE,
// 3 "Ốp lưng điện thoại" HIDDEN`,
            takeaway: "Một giá trị, hai cách index",
          },
          {
            title: "term trên text và trên keyword (kết quả thật)",
            diagram: { kind: "flow", steps: ["term name = \"Điện thoại Sạc Nhanh\"", "name là text: index chỉ có dien, thoai, sac, nhanh", "term không qua analyzer: tìm nguyên cụm"], ok: ["term name.raw", "1 kết quả (khớp nguyên văn)"], bad: ["term name", "0 kết quả"] },
            code: `// term trên field text
{"query":{"term":{"name":"Điện thoại Sạc Nhanh"}}}
→ {"hits":{"total":{"value":0}}}

// term trên field keyword, đúng nguyên văn
{"query":{"term":{"name.raw":"Điện thoại Sạc Nhanh"}}}
→ {"hits":{"total":{"value":1},"hits":[{"_id":"1"}]}}

// keyword phân biệt hoa thường
{"query":{"term":{"name.raw":"điện thoại sạc nhanh"}}}  → value 0
{"query":{"term":{"status":"ACTIVE"}}}                 → value 2
{"query":{"term":{"status":"active"}}}                 → value 0`,
            takeaway: "Term trên text gần như luôn sai",
          },
          {
            title: "Sort trên text: lỗi 400",
            diagram: { kind: "flow", steps: ["sort: name asc", "name là text, không có doc values", "fielddata mặc định tắt"], ok: ["Sort theo name.raw", "Chạy bình thường"], bad: ["Sort theo name", "illegal_argument_exception"] },
            code: `{"sort":[{"name":"asc"}]}

// Response thật (rút gọn):
"Fielddata is disabled on [name] in [products]. Text fields are
not optimised for operations that require per-document field data
like aggregations and sorting, so these operations are disabled by
default. Please use a keyword field instead."

// Aggregation trên keyword thì chạy
// (chạy lúc index đã có thêm tài liệu 9 và 10 ở Phần 4, 5):
{"aggs":{"by_status":{"terms":{"field":"status"}}}}
→ buckets: [{"key":"ACTIVE","doc_count":4},{"key":"HIDDEN","doc_count":1}]`,
            notes: ["Bật `fielddata=true` trên text thì sort được nhưng tốn heap và sort theo từng token, không theo cả chuỗi. Gần như luôn nên dùng keyword."],
            takeaway: "Sort và aggregation dùng keyword",
          },
        ],
        conclusion: "**Kết luận:** `text` để tìm, `keyword` để lọc, sort, đếm. Cần cả hai thì khai multi-field ngay từ đầu.",
      },
      after: [
        "**Dynamic mapping**: ghi tài liệu vào index chưa có mapping, Elasticsearch tự đoán kiểu. Chạy thử với `{\"sku\":\"SP-001\",\"price\":\"100\",\"createdAt\":\"2026-11-24T10:00:00Z\"}` cho ra mapping thật:",
        "- `createdAt`: `date` (đoán đúng nhờ định dạng ISO).",
        "- `price`: `text` kèm `price.keyword`, vì client gửi chuỗi `\"100\"`. Lọc `range` theo giá giờ là so chuỗi, không phải so số.",
        "- `sku`: `text` kèm `sku.keyword` với `ignore_above: 256`: tốn gấp đôi chỗ cho một field chỉ cần keyword.",
        "Những rủi ro khác của dynamic mapping: kiểu được chốt theo tài liệu **đầu tiên** (tài liệu sau gửi kiểu khác sẽ bị từ chối), và JSON có key động (ví dụ map `userId → điểm`) làm số field phình ra tới khi chạm giới hạn `index.mapping.total_fields.limit` (mặc định 1000). Production nên khai mapping tường minh, hoặc đặt `\"dynamic\": \"strict\"` để field lạ bị từ chối thay vì lặng lẽ thêm vào.",
        "Mapping của field đã có thì **không đổi kiểu được** (`text` sang `keyword` chẳng hạn), vì dữ liệu cũ đã index theo kiểu cũ. Thêm field mới hoặc thêm multi-field mới thì được, nhưng tài liệu cũ chỉ có giá trị ở field mới sau khi được index lại. Muốn đổi kiểu thì index mới cộng reindex.",
      ],
      takeaway: {
        lines: [
          "`text`: analyzer, tìm toàn văn. `keyword`: nguyên văn, lọc, sort, aggregation, phân biệt hoa thường.",
          "Khai mapping tường minh; dynamic mapping đoán sai kiểu là chuyện thường.",
        ],
      },
      trap: {
        title: "term trên field text",
        text: "Viết `term: {name: \"Điện thoại Sạc Nhanh\"}` trên field `text` cho 0 kết quả, vì index chỉ chứa các token đã chuẩn hoá. Lọc chính xác dùng field keyword (`name.raw`); tìm theo nội dung dùng `match`.",
      },
      quiz: {
        question: "Cần hiển thị số sản phẩm theo từng thương hiệu (facet). Field `brand` nên có mapping gì?",
        options: [
          "`text` với analyzer standard",
          "`keyword` (hoặc multi-field có con `keyword`), vì aggregation cần doc values và giá trị nguyên văn",
          "`long`",
          "Không cần mapping, dynamic là đủ",
        ],
        answer: 1,
        explain: "Aggregation `terms` chạy trên keyword. Text không có doc values và bị tách token, nên \"Apple Inc\" sẽ thành hai bucket `apple` và `inc` nếu cố bật fielddata.",
      },
    },
    {
      id: "query",
      scene: "query",
      title: "Phần 3: Query: match, term, bool và phân trang",
      intro: [
        "Mapping đã đúng. Giờ viết query sao cho vừa đúng kết quả vừa nhanh.",
      ],
      quiz: {
        question: "Trong `bool`, mệnh đề nào vừa bắt buộc khớp vừa không tính điểm?",
        options: ["`must`", "`should`", "`filter`", "`must_not` và `should`"],
        answer: 2,
        explain: "`must` bắt buộc và tính điểm. `filter` bắt buộc nhưng không tính điểm và có thể được cache. `must_not` loại trừ, cũng không tính điểm. `should` cộng điểm (hoặc bắt buộc khi bool không có must/filter).",
      },
      parts: [
        {
          id: "match-term",
          title: "Match và term",
          intro: [
            "Hai query cơ bản nhất khác nhau ở đúng một điểm: **query có qua analyzer hay không**.",
            "- **`match`**: chạy chuỗi tìm kiếm qua analyzer của field, rồi tìm các token đó. Mặc định `operator: or` (có một token là khớp, khớp nhiều thì điểm cao hơn); đặt `operator: and` hoặc `minimum_should_match` để chặt hơn. Dùng cho field `text`.",
            "- **`term`**: **không** phân tích, tìm đúng nguyên văn trong index. Dùng cho `keyword`, số, ngày, boolean, id.",
            "- **`match_phrase`**: như match nhưng các token phải đứng liền nhau đúng thứ tự (dùng vị trí trong posting list).",
          ],
          predict: {
            question: "Index `products` dùng analyzer `vn_fold`. Query `match` với `dien thoai` (không dấu) trên field `name` trả về những tài liệu nào?",
            options: [
              "Không tài liệu nào, vì tên lưu có dấu",
              "Tài liệu 1 \"Điện thoại Sạc Nhanh\" và 3 \"Ốp lưng điện thoại\"",
              "Chỉ tài liệu 1, vì \"điện thoại\" đứng đầu",
              "Cả ba tài liệu",
            ],
            answer: 1,
            explain: "Query qua `vn_fold` thành `dien`, `thoai`. Tài liệu 1 và 3 đều có hai token đó, tài liệu 2 \"Sạc dự phòng\" thì không. Hai tài liệu có cùng độ dài 4 token nên điểm bằng nhau (0.94).",
          },
          widgetTitle: "Tìm sản phẩm \"điện thoại\" (kết quả chạy thật)",
          compare: [
            way(
              "match",
              `GET /products/_search
{ "query": { "match": { "name": "dien thoai" } } }

// Response thật:
{"hits":{"total":{"value":2},"hits":[
  {"_id":"1","_score":0.9400072},
  {"_id":"3","_score":0.9400072}]}}`,
              [
                ask("Người dùng gõ không dấu", ok("Query qua cùng analyzer `vn_fold` nên `dien thoai` khớp `Điện thoại`.")),
                ask("Cần xếp hạng", ok("Có `_score` theo BM25.")),
                ask("Lọc `status = ACTIVE`", bad("Không hợp: match trên keyword so nguyên văn, và tính điểm vô ích. Dùng term trong filter.")),
              ],
              "Dùng cho tìm kiếm toàn văn trên field text.",
            ),
            way(
              "term",
              `GET /products/_search
{ "query": { "term": { "name": "Điện thoại Sạc Nhanh" } } }
→ {"hits":{"total":{"value":0}}}

// term với đúng một token đã chuẩn hoá thì lại khớp:
{ "query": { "term": { "name": "dien" } } }
→ {"hits":{"total":{"value":2}}}`,
              [
                ask("Người dùng gõ không dấu", bad("Term không qua analyzer, chuỗi người dùng gõ hiếm khi trùng đúng một token trong index.")),
                ask("Lọc `status = ACTIVE`", ok("Đúng chỗ của term: field keyword, so nguyên văn.")),
                ask("Lọc theo id, số, ngày", ok("Term và range trên field không phải text.")),
              ],
              "Dùng cho giá trị chính xác trên keyword, số, ngày.",
            ),
          ],
          takeaway: {
            lines: ["Match: qua analyzer, cho text. Term: nguyên văn, cho keyword và giá trị chính xác."],
          },
          quiz: {
            question: "Vì sao `term: {name: \"dien\"}` lại khớp 2 tài liệu trong khi `term: {name: \"Điện thoại Sạc Nhanh\"}` khớp 0?",
            options: [
              "Term có phân tích chuỗi ngắn",
              "Index của field text chứa token `dien`; term tìm đúng nguyên văn nên chỉ khớp khi chuỗi trùng một token đã chuẩn hoá",
              "Do cache",
              "Do số shard",
            ],
            answer: 1,
            explain: "Term không chạy analyzer. Nó chỉ khớp khi giá trị bạn gửi trùng đúng một token trong inverted index. Viết term như vậy trên text là dựa vào chi tiết của analyzer, rất dễ vỡ.",
          },
        },
        {
          id: "bool-filter",
          title: "Bool query, filter context và BM25",
          intro: [
            "Query thật thường kết hợp: tìm theo chữ, lọc theo trạng thái và khoảng giá. **`bool`** có bốn loại mệnh đề:",
            "- **`must`**: bắt buộc khớp, **có tính điểm**.",
            "- **`filter`**: bắt buộc khớp, **không tính điểm**.",
            "- **`should`**: khớp thì cộng điểm. Nếu bool không có `must` hay `filter` thì phải khớp ít nhất một `should`.",
            "- **`must_not`**: loại trừ, không tính điểm.",
            "Elasticsearch chia hai ngữ cảnh: **query context** trả lời \"khớp **tốt đến đâu**\" (tính `_score`), **filter context** chỉ trả lời \"có hay không\". Điều kiện có/không (status, giá, ngày, quyền xem) nên nằm trong `filter` vì:",
            "- **Không tính điểm**: bỏ được phần tính BM25 cho mệnh đề đó.",
            "- **Có thể được cache**: node query cache giữ kết quả filter dùng thường xuyên dưới dạng bitset theo từng segment, lần sau khỏi tính lại.",
            "- **Không làm méo xếp hạng**: điểm chỉ phản ánh mức khớp chữ, không bị cộng thêm vì khớp status.",
            "**BM25** là công thức tính điểm mặc định. Ba yếu tố:",
            "- **Term frequency**: từ xuất hiện nhiều lần trong tài liệu thì điểm cao hơn, nhưng **bão hoà** (tham số `k1`, mặc định 1.2), lặp 50 lần không hơn 5 lần bao nhiêu.",
            "- **Inverse document frequency**: từ hiếm trong toàn index đáng giá hơn từ phổ biến. `sạc` hiếm thì đáng giá hơn `điện`.",
            "- **Độ dài field**: khớp trong field ngắn thì điểm cao hơn field dài (tham số `b`, mặc định 0.75).",
            "IDF được tính **theo từng shard** theo mặc định, nên với ít dữ liệu và nhiều shard, cùng một tài liệu có thể có điểm hơi khác nhau. Khi test thì dùng 1 shard hoặc `search_type=dfs_query_then_fetch`.",
          ],
          board: {
            title: "Filter không tính điểm (kết quả thật)",
            highlight: "Filter",
            chips: ["must", "filter", "_score"],
            cards: [
              {
                title: "Tìm \"sac\", lọc ACTIVE và giá tới 1 triệu",
                diagram: { kind: "flow", steps: ["must: match name \"sac\"", "filter: term status ACTIVE", "filter: range price lte 1000000"], ok: ["Tài liệu 2", "_score chỉ từ phần must"], bad: ["Tài liệu 1", "Bị loại vì giá 5 triệu"] },
                code: `{ "query": { "bool": {
    "must":   [ { "match": { "name": "sac" } } ],
    "filter": [ { "term":  { "status": "ACTIVE" } },
                { "range": { "price": { "lte": 1000000 } } } ] } } }

→ {"hits":{"hits":[{"_id":"2","_score":0.4700036}]}}

// Chỉ có filter, không có must:
{ "query": { "bool": { "filter": [ { "term": { "status": "ACTIVE" } } ] } } }
→ {"hits":{"hits":[{"_id":"1","_score":0.0},{"_id":"2","_score":0.0}]}}`,
                takeaway: "Filter chỉ lọc, `_score` bằng 0",
              },
            ],
            conclusion: "**Kết luận:** chữ người dùng gõ vào `must`, mọi điều kiện có/không vào `filter`.",
          },
          trap: {
            title: "Đặt term status vào must",
            text: "Kết quả vẫn đúng, nhưng mọi tài liệu khớp được cộng thêm điểm từ term đó và filter không được cache. Thứ tự xếp hạng bị nhiễu, và tốn công tính điểm cho điều kiện vốn chỉ là có hoặc không.",
          },
          quiz: {
            question: "Theo BM25, cùng khớp từ `sạc`, tài liệu nào thường có điểm cao hơn?",
            options: [
              "Tên dài 30 từ có một lần `sạc`",
              "Tên dài 3 từ có một lần `sạc`",
              "Hai tài liệu bằng điểm",
              "Tài liệu được index trước",
            ],
            answer: 1,
            explain: "BM25 chuẩn hoá theo độ dài field: một lần khớp trong field ngắn chiếm tỉ lệ lớn hơn nên điểm cao hơn.",
          },
        },
        {
          id: "pagination",
          title: "Phân trang: from/size, giới hạn 10.000 và search_after",
          intro: [
            "Cách quen thuộc là `from` và `size`, giống `OFFSET` và `LIMIT`. Vấn đề: để trả trang ở `from = 9.990`, **mỗi shard** phải lấy ra top `from + size` tài liệu, gửi về node điều phối, node đó gộp và sắp lại rồi bỏ gần hết. Càng sâu càng tốn bộ nhớ và CPU, nhân theo số shard.",
            "Vì thế Elasticsearch chặn mặc định ở `index.max_result_window = 10000`. Thử `from: 10000, size: 10` trả về lỗi thật: `Result window is too large, from + size must be less than or equal to: [10000] but was [10010]`.",
            "Ba lựa chọn:",
            "- **`from`/`size`**: cho giao diện người dùng vài trang đầu. Hầu như không ai bấm tới trang 500; giới hạn số trang trên UI.",
            "- **`search_after`**: phân trang kiểu keyset. Sort theo một bộ khoá **duy nhất** (thêm một field phá hoà như id), trang sau gửi giá trị `sort` của tài liệu cuối trang trước. Không có giới hạn độ sâu. Kèm **point in time** (PIT) nếu cần ảnh chụp nhất quán khi dữ liệu đang thay đổi.",
            "- **Scroll**: API cũ cho xuất dữ liệu lớn; tài liệu chính thức hiện khuyên dùng `search_after` kèm PIT thay cho scroll khi phân trang sâu.",
            "Đây đúng là ý tưởng keyset pagination trong bài SQL: nhớ \"điểm dừng\" thay vì đếm bỏ qua N dòng.",
          ],
          board: {
            title: "search_after: nhớ điểm dừng (kết quả thật)",
            highlight: "search_after",
            chips: ["sort", "tie-breaker", "PIT"],
            cards: [
              {
                title: "Hai trang, mỗi trang 2 tài liệu",
                diagram: { kind: "flow", steps: ["Trang 1: sort price desc, name.raw asc", "Lấy giá trị sort của tài liệu cuối", "Trang 2: gửi search_after = giá trị đó"], ok: ["Không giới hạn độ sâu", "Mỗi shard chỉ lấy size tài liệu"], bad: ["from/size sâu", "Mỗi shard lấy from + size"] },
                code: `// Trang 1
{ "size": 2, "sort": [ { "price": "desc" }, { "name.raw": "asc" } ] }
→ [{"_id":"1","sort":[5000000,"Điện thoại Sạc Nhanh"]},
   {"_id":"2","sort":[600000,"Sạc dự phòng 20000mAh"]}]

// Trang 2
{ "size": 2, "sort": [ { "price": "desc" }, { "name.raw": "asc" } ],
  "search_after": [600000, "Sạc dự phòng 20000mAh"] }
→ [{"_id":"3","sort":[90000,"Ốp lưng điện thoại"]}]`,
                notes: ["Ví dụ phá hoà bằng `name.raw` cho gọn; thực tế nên dùng một field duy nhất như id sản phẩm lưu dạng keyword."],
                takeaway: "Sort phải duy nhất để không mất hay lặp tài liệu",
              },
            ],
            conclusion: "**Kết luận:** UI vài trang đầu dùng from/size; duyệt sâu hoặc xuất dữ liệu dùng search_after kèm PIT.",
          },
          quiz: {
            question: "Vì sao `from` lớn tốn kém hơn nhiều trên Elasticsearch so với một bảng nhỏ?",
            options: [
              "Vì Elasticsearch không có index",
              "Vì mỗi shard phải trả top `from + size` về node điều phối để gộp, chi phí nhân theo số shard và độ sâu",
              "Vì JSON chậm",
              "Vì replica phải đồng bộ",
            ],
            answer: 1,
            explain: "Tìm kiếm phân tán theo hai pha query và fetch. Ở pha query, mỗi shard xếp hạng và gửi top `from + size`; node điều phối gộp tất cả. Trang càng sâu càng nhiều dữ liệu phải gộp rồi bỏ đi.",
          },
        },
      ],
    },
    {
      id: "shards",
      scene: "shards",
      title: "Phần 4: Shard, replica, near real-time và routing",
      intro: [
        "Phần 3 nhắc \"mỗi shard\" nhiều lần. Shard là gì, và vì sao số shard là quyết định khó sửa?",
        "Một index được chia thành nhiều **primary shard**; mỗi shard là một index Lucene độc lập, nằm trên một node. Mỗi primary có thể có **replica**, là bản sao nằm trên **node khác**:",
        "- **Primary shard**: chia dữ liệu để scale phần ghi và dung lượng. Số lượng **chốt khi tạo index**.",
        "- **Replica**: chịu lỗi (node chết thì replica được nâng lên primary) và tăng thông lượng đọc. **Đổi được bất cứ lúc nào**. Trên cluster một node, replica không có chỗ để đặt nên cluster báo vàng (yellow); lúc chạy thử ta đặt `number_of_replicas: 0`.",
        "**Routing**: tài liệu vào shard nào được tính bằng `shard = hash(_routing) % số_primary_shard` (bản thật phức tạp hơn một chút, nhưng ý là vậy), mặc định `_routing` là `_id`. Đó là lý do số primary không đổi được: đổi số chia thì mọi tài liệu cũ nằm sai chỗ, lấy theo id sẽ tìm sai shard. Thử đổi trên index đang mở, Elasticsearch trả lỗi thật: `Can't update non dynamic settings [[index.number_of_shards]] for open indices`.",
        "Muốn đổi: tạo index mới rồi reindex, hoặc dùng API `_split` (tăng theo bội số) và `_shrink` (giảm về ước số) trên index đã khoá ghi. Cách thường dùng nhất vẫn là index mới cộng alias (Phần 5).",
        "**Custom routing**: đặt `routing=tenantId` khi ghi và khi tìm thì mọi tài liệu của một tenant nằm chung một shard, query chỉ chạm một shard. Đổi lại, tenant lớn có thể làm shard đó lệch (hot shard).",
        "**Near real-time**: ghi xong chưa tìm thấy ngay. Tài liệu mới nằm trong bộ đệm, chỉ hiện ra cho search sau một lần **refresh**, tức lúc buffer được ghi thành segment mới có thể tìm. Mặc định `refresh_interval` là **1 giây** (với index đang được search; index lâu không ai search sẽ hoãn refresh). Độ bền thì không phụ thuộc refresh: mỗi thao tác ghi được ghi vào **translog** trước khi trả lời thành công.",
      ],
      board: {
        title: "Ghi xong chưa chắc tìm thấy (kết quả thật)",
        highlight: "chưa chắc tìm thấy",
        chips: ["refresh_interval", "translog", "GET by id"],
        cards: [
          {
            title: "Đặt refresh_interval 30s để thấy rõ khoảng trễ",
            diagram: { kind: "flow", steps: ["PUT /products/_doc/10 (Tai nghe)", "search \"tai nghe\": 0 kết quả", "GET /products/_doc/10: found true", "POST /products/_refresh"], ok: ["search lại", "1 kết quả"], bad: ["Trước refresh", "search không thấy"] },
            code: `PUT /products/_settings { "index": { "refresh_interval": "30s" } }
PUT /products/_doc/10 { "name": "Tai nghe", "status": "ACTIVE", "price": 1 }

search match "tai nghe"  → {"hits":{"total":{"value":0}}}
GET /products/_doc/10    → {"found":true}
POST /products/_refresh
search match "tai nghe"  → {"hits":{"total":{"value":1}}}`,
            notes: ["GET theo id là realtime (đọc được cả tài liệu chưa refresh), còn search thì phải chờ refresh."],
            takeaway: "Search thấy dữ liệu sau refresh, GET by id thấy ngay",
          },
        ],
        conclusion: "**Kết luận:** đừng viết test hay luồng nghiệp vụ \"ghi xong search ngay\". Cần thì dùng `?refresh=wait_for` cho đúng request đó, không gọi `_refresh` sau mỗi lần ghi.",
      },
      cheat: [
        { name: "Primary shard", one: "Chia dữ liệu, chốt khi tạo index", say: "Số primary shard cố định vì routing dùng hash(id) chia lấy dư cho số shard. Đổi phải reindex hoặc split/shrink." },
        { name: "Replica", one: "Bản sao trên node khác, đổi lúc nào cũng được", say: "Replica vừa để chịu lỗi vừa chia tải đọc; nó không bao giờ nằm cùng node với primary của nó." },
        { name: "Refresh", one: "Làm dữ liệu mới tìm được, mặc định 1 giây", say: "Elasticsearch là near real-time: ghi xong khoảng một giây sau mới search thấy. Bulk load lớn thì tăng refresh_interval hoặc tắt (-1) rồi bật lại." },
        { name: "Translog", one: "Nhật ký ghi để không mất dữ liệu khi sập", say: "Refresh lo khả năng tìm thấy, translog lo độ bền. Hai việc khác nhau." },
        { name: "Routing", one: "Quyết định tài liệu nằm shard nào", say: "Mặc định route theo _id. Route theo tenant giúp query chỉ chạm một shard, đổi lại dễ lệch tải." },
      ],
      takeaway: {
        title: "Chuỗi nhân quả cần nhớ",
        lines: [
          "Routing là hash chia lấy dư cho số primary, nên số primary chốt khi tạo; replica thì đổi tự do.",
          "Ghi vào buffer và translog, refresh mới tìm thấy: khoảng trễ mặc định cỡ 1 giây.",
        ],
      },
      trap: {
        title: "Quá nhiều shard nhỏ",
        text: "Mỗi shard tốn heap, file và luồng xử lý; query phải hỏi mọi shard. Tạo index mỗi ngày với 5 shard cho vài MB dữ liệu sẽ làm cluster chậm dần. Chọn số shard theo dung lượng dự kiến (tài liệu Elastic gợi ý cỡ vài chục GB mỗi shard), không đặt nhiều \"cho chắc\".",
      },
      quiz: {
        question: "Vừa `save()` một sản phẩm rồi gọi API search ngay, không thấy sản phẩm. Giải thích nào đúng?",
        options: [
          "Ghi bị mất, cần retry",
          "Near real-time: tài liệu chỉ search thấy sau lần refresh kế tiếp (mặc định khoảng 1 giây); dữ liệu đã an toàn trong translog",
          "Do replica chưa đồng bộ nên mất dữ liệu",
          "Do thiếu mapping",
        ],
        answer: 1,
        explain: "Ghi đã thành công và bền nhờ translog. Search chỉ thấy segment đã refresh. Nếu luồng nghiệp vụ thật sự cần thấy ngay, dùng `refresh=wait_for` cho request ghi đó.",
      },
    },
    {
      id: "sync",
      scene: "sync",
      senior: true,
      title: "Phần 5: Đồng bộ database sang Elasticsearch",
      intro: [
        "Elasticsearch gần như luôn là **bản sao để tìm kiếm** của dữ liệu nằm trong database chính. Câu hỏi senior kinh điển: giữ hai bên khớp nhau thế nào?",
      ],
      quiz: {
        question: "Bản ghi trong Elasticsearch nên dùng `_id` là gì để việc index lại an toàn khi event bị gửi trùng?",
        options: [
          "Để Elasticsearch tự sinh id",
          "Khoá chính của bản ghi trong database, để ghi lần hai chỉ ghi đè đúng tài liệu đó",
          "Timestamp lúc index",
          "Offset của message Kafka",
        ],
        answer: 1,
        explain: "Dùng id nghiệp vụ làm `_id` thì index lại là upsert, chạy bao nhiêu lần cũng ra một tài liệu. Id tự sinh sẽ tạo bản trùng mỗi lần retry.",
      },
      parts: [
        {
          id: "outbox-cdc",
          senior: true,
          title: "Dual write, outbox và CDC",
          intro: [
            "Cách đầu tiên ai cũng nghĩ tới: trong service, lưu database rồi gọi Elasticsearch. Đó là **dual write**, và nó hỏng theo nhiều kiểu:",
            "- **Ghi ES lỗi sau khi DB đã commit**: DB có, ES không. Sản phẩm mới không bao giờ tìm thấy.",
            "- **Ghi ES trong transaction, transaction rollback sau đó**: ES có tài liệu \"ma\" không tồn tại trong DB.",
            "- **Hai request cập nhật cùng sản phẩm chạy song song**: thứ tự ghi vào DB và vào ES có thể ngược nhau, ES giữ bản cũ.",
            "- **Request API chậm và phụ thuộc ES**: ES chậm hay sập thì luồng lưu sản phẩm cũng chậm hay lỗi theo.",
            "Cách đúng là chỉ ghi **một** nơi trong transaction, rồi lan truyền bất đồng bộ:",
            "- **Transactional outbox**: trong cùng transaction với `product`, insert một dòng vào bảng `outbox` (\"product 42 đã đổi\"). Một relay đọc outbox và đẩy lên Kafka. Commit thì có cả hai, rollback thì không có cả hai.",
            "- **CDC (Change Data Capture)**: công cụ như **Debezium** đọc log thay đổi của database (WAL của PostgreSQL, binlog của MySQL) và phát mỗi thay đổi thành event lên Kafka. Không phải sửa code ghi, nhưng event mang hình dạng bảng; nhiều đội kết hợp: Debezium đọc chính bảng outbox.",
            "Phía sau Kafka là một **indexer**: đọc event, (thường) đọc lại bản mới nhất từ DB hoặc dùng payload trong event, dựng tài liệu tìm kiếm và ghi vào ES.",
            "Kafka giao **ít nhất một lần**, có thể trùng và (giữa các partition) không đúng thứ tự. Indexer phải **idempotent**:",
            "- **`_id` = khoá chính trong DB**: ghi lại là ghi đè, không sinh bản trùng.",
            "- **Version ngoài** (`version_type=external`): gửi kèm version của dòng trong DB (cột version tăng dần hoặc thời điểm cập nhật dạng số). Elasticsearch chỉ nhận nếu version mới **lớn hơn** bản đang có, event cũ đến muộn bị từ chối.",
            "- **Partition key = id sản phẩm**: các event của cùng sản phẩm vào cùng partition nên đến theo thứ tự.",
            "- **Xoá cũng có version**: xoá bằng external version để một event cập nhật cũ đến muộn không \"hồi sinh\" tài liệu.",
          ],
          board: {
            title: "Một đường ghi, lan truyền qua Kafka",
            highlight: "Một đường ghi",
            chips: ["outbox", "Debezium", "Kafka", "external version"],
            cards: [
              {
                title: "Luồng outbox hoặc CDC",
                diagram: { kind: "flow", steps: ["Service: UPDATE product + INSERT outbox (1 transaction)", "Relay hoặc Debezium đọc outbox / WAL", "Kafka topic product-changes (key = productId)", "Indexer: PUT /products/_doc/{id}?version={v}&version_type=external"], ok: ["Event mới hơn", "Ghi đè, version tăng"], bad: ["Event cũ hoặc trùng", "409 version_conflict, bỏ qua"] },
                code: `// Chạy thật: ghi version 5, rồi event cũ version 3 đến muộn
PUT /products/_doc/9?version=5&version_type=external
{ "name": "v5", "status": "ACTIVE", "price": 1 }
→ {"_id":"9","_version":5,"result":"created"}

PUT /products/_doc/9?version=3&version_type=external
{ "name": "v3", "status": "ACTIVE", "price": 1 }
→ 409 {"type":"version_conflict_engine_exception",
       "reason":"[9]: version conflict, current version [5]
                 is higher or equal to the one provided [3]"}

GET /products/_doc/9 → {"_version":5,"_source":{"name":"v5"}}`,
                notes: ["Indexer coi 409 do version là thành công (đã có bản mới hơn), commit offset và đi tiếp. Lỗi khác thì retry, quá số lần thì đẩy sang dead letter topic."],
                takeaway: "Bản cũ đến muộn không ghi đè được bản mới",
              },
            ],
            conclusion: "**Kết luận:** DB là nguồn sự thật, ES là bản sao trễ vài giây. Một đường ghi, lan truyền bất đồng bộ, index bằng id cộng version.",
          },
          trap: {
            title: "@TransactionalEventListener không phải outbox",
            text: "Gửi lên Kafka hay ES trong `AFTER_COMMIT` vẫn là dual write: app sập ngay sau commit là mất event. Outbox ghi event vào DB trong cùng transaction nên không mất.",
          },
          quiz: {
            question: "Vì sao dual write (lưu DB rồi gọi ES trong cùng request) gây lệch dữ liệu?",
            options: [
              "Vì ES không hỗ trợ JSON",
              "Vì hai hệ thống không có chung transaction: một bên thành công, bên kia lỗi hoặc rollback là lệch, và thứ tự ghi song song có thể đảo",
              "Vì ES chậm hơn DB",
              "Vì Spring không cho gọi hai hệ thống",
            ],
            answer: 1,
            explain: "Không có transaction phân tán giữa DB và ES. Outbox hoặc CDC biến việc lan truyền thành một chuỗi event bền vững, có thể retry, và version giải quyết thứ tự.",
          },
        },
        {
          id: "reindex-alias",
          senior: true,
          title: "Reindex không downtime bằng alias",
          intro: [
            "Phần 1 và 2 đều kết luận: đổi analyzer, đổi kiểu field, đổi số shard đều phải **index mới cộng reindex**. Làm sao không phải sửa code và không có lúc search trống?",
            "**Alias** là một tên trỏ tới một (hoặc nhiều) index thật. App chỉ biết `products_live`, không biết `products_v1` hay `products_v2`. Quy trình:",
            "- **Tạo `products_v2`** với mapping và settings mới (khai báo đầy đủ, đừng để dynamic mapping đoán).",
            "- **Nạp dữ liệu**: bulk load từ DB (nguồn sự thật), hoặc `_reindex` từ index cũ nếu `_source` đủ. Khi bulk load, tạm đặt `refresh_interval: -1` và `number_of_replicas: 0` cho nhanh, xong thì bật lại.",
            "- **Bắt kịp thay đổi** xảy ra trong lúc nạp: cho indexer ghi vào cả hai index, hoặc ghi lại vị trí Kafka trước khi bắt đầu rồi phát lại từ đó vào v2. Version ngoài giúp phát lại an toàn.",
            "- **Đổi alias trong một lệnh `_aliases`**: bỏ v1 và thêm v2 trong cùng một request, Elasticsearch áp dụng nguyên tử nên không có lúc alias trống.",
            "- **Giữ v1 một thời gian** để quay lại nếu có lỗi, rồi xoá.",
          ],
          board: {
            title: "Đổi alias nguyên tử (chạy thật)",
            highlight: "nguyên tử",
            chips: ["_reindex", "_aliases", "products_live"],
            cards: [
              {
                title: "Từ products sang products_v2",
                diagram: { kind: "flow", steps: ["Tạo products_v2", "_reindex từ products", "_aliases: remove v1 + add v2 (1 request)"], ok: ["App vẫn gọi products_live", "Không sửa code, không downtime"], bad: ["Quên khai mapping cho v2", "Dynamic mapping, analyzer mất"] },
                code: `POST /_reindex?refresh=true
{ "source": { "index": "products" }, "dest": { "index": "products_v2" } }
→ {"total":5,"created":5}

POST /_aliases
{ "actions": [
  { "remove": { "index": "products",    "alias": "products_live" } },
  { "add":    { "index": "products_v2", "alias": "products_live" } } ] }
→ {"acknowledged":true,"errors":false}

GET /_alias/products_live
→ {"products_v2":{"aliases":{"products_live":{}}}}`,
                notes: ["Trong lần chạy này `products_v2` được tạo không có mapping. Sau reindex, `term: {name: \"dien\"}` trên v2 cho 0 kết quả (trên index cũ là 2), vì dynamic mapping dùng analyzer standard và không bỏ dấu. Đúng cái bẫy ở thẻ này."],
                takeaway: "App chỉ biết alias, index thật thay được",
              },
            ],
            conclusion: "**Kết luận:** ngay từ ngày đầu, app đọc và ghi qua alias. Đổi cấu trúc index chỉ còn là tạo v2, nạp, bắt kịp, đổi alias.",
          },
          takeaway: {
            lines: [
              "Đổi mapping hay số shard thì index mới, nạp lại, đổi alias nguyên tử.",
              "`_reindex` chỉ chép dữ liệu, không chép mapping: tạo index đích với mapping đầy đủ trước.",
            ],
          },
          quiz: {
            question: "Vì sao bước đổi alias phải gộp `remove` và `add` trong cùng một request `_aliases`?",
            options: [
              "Vì gọi hai request sẽ bị tính phí gấp đôi",
              "Vì các action trong một request được áp dụng nguyên tử: không có khoảnh khắc alias trỏ vào rỗng hoặc trỏ cả hai index",
              "Vì remove không chạy riêng được",
              "Không cần, gọi riêng cũng an toàn",
            ],
            answer: 1,
            explain: "Gọi remove rồi mới add thì giữa hai lệnh, search qua alias sẽ lỗi index không tồn tại. Add trước rồi remove thì có lúc alias trỏ hai index và trả kết quả trùng.",
          },
        },
      ],
    },
    {
      id: "when-not",
      scene: "when-not",
      title: "Phần 6: Khi nào không dùng Elasticsearch, và Spring Data Elasticsearch",
      intro: [
        "Sau năm phần, câu hỏi chốt của phỏng vấn viên thường là: \"Vậy có nên lưu luôn đơn hàng vào Elasticsearch không?\"",
        "Không nên dùng Elasticsearch làm **nguồn sự thật**:",
        "- **Không có transaction ACID nhiều tài liệu**: mỗi thao tác chỉ nguyên tử trên một tài liệu. Không có \"trừ kho và tạo đơn cùng lúc\".",
        "- **Near real-time**: đọc ngay sau ghi qua search có thể không thấy.",
        "- **Không có ràng buộc**: không unique constraint (ngoài `_id`), không khoá ngoại.",
        "- **Đổi schema tốn kém**: đổi kiểu field là reindex.",
        "- **Thêm một hệ thống phải vận hành**: cluster, heap, shard, nâng cấp phiên bản, pipeline đồng bộ, giám sát độ trễ đồng bộ.",
        "Với dữ liệu nhỏ và vừa (vài trăm nghìn tới vài triệu dòng), nhu cầu chỉ là \"tìm theo tên có index, có xếp hạng, gõ không dấu\": PostgreSQL với `tsvector` + GIN, `unaccent`, `pg_trgm` thường là đủ, không cần đồng bộ, không trễ, nằm chung transaction. Chọn Elasticsearch khi thực sự cần: fuzzy và gợi ý khi gõ, facet nhiều chiều trên dữ liệu lớn, log và phân tích, hoặc tải tìm kiếm đủ lớn để cần tách khỏi DB chính.",
        "**Spring Data Elasticsearch** cho Spring Boot (starter `spring-boot-starter-data-elasticsearch`, cấu hình `spring.elasticsearch.uris`). Những gì cần nói được:",
        "- **`@Document(indexName = ...)`** cho entity tìm kiếm, **`@Field(type = FieldType.Keyword)`** để khai kiểu tường minh, **`@MultiField`** cho text kèm keyword.",
        "- **`ElasticsearchRepository<T, ID>`**: `save`, `findById`, derived query như `findByStatus`. Hợp CRUD và query đơn giản.",
        "- **`ElasticsearchOperations`** với **`NativeQuery`** cho bool query, filter, aggregation, `search_after`: query thật thường đi đường này.",
        "- Tách class tài liệu tìm kiếm (`ProductDocument`) khỏi JPA entity (`Product`): hình dạng tài liệu tìm kiếm thường đã gộp sẵn (tên danh mục, thương hiệu) để khỏi join lúc tìm.",
        "- Khi tự tạo index từ annotation, hãy chú ý index thật nên được tạo qua mapping có kiểm soát (và alias), không để app tự sinh mapping ở production.",
      ],
      board: {
        title: "Spring Data Elasticsearch trong một thẻ",
        highlight: "Spring Data Elasticsearch",
        chips: ["@Document", "@MultiField", "NativeQuery"],
        cards: [
          {
            title: "Document, repository và một bool query",
            diagram: { kind: "hub", inputs: [{ label: "@Document(indexName = \"products_live\")" }, { label: "ElasticsearchRepository" }, { label: "ElasticsearchOperations + NativeQuery" }], center: "ProductDocument", rulesTitle: "Quy ước", rules: ["`_id` = id trong DB", "Ghi qua alias", "Query phức tạp dùng NativeQuery"] },
            code: `@Document(indexName = "products_live", createIndex = false)
public class ProductDocument {
  @Id private String id;
  @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "vn_fold"),
              otherFields = @InnerField(suffix = "raw", type = FieldType.Keyword))
  private String name;
  @Field(type = FieldType.Keyword) private String status;
  @Field(type = FieldType.Long) private long price;
}

public interface ProductSearchRepo extends ElasticsearchRepository<ProductDocument, String> {
  List<ProductDocument> findByStatus(String status);
}

// bool: match trong must, điều kiện trong filter
NativeQuery q = NativeQuery.builder()
    .withQuery(b -> b.bool(bb -> bb
        .must(m -> m.match(mm -> mm.field("name").query(text)))
        .filter(f -> f.term(t -> t.field("status").value("ACTIVE")))))
    .withPageable(PageRequest.of(0, 20))
    .build();
SearchHits<ProductDocument> hits = operations.search(q, ProductDocument.class);`,
            notes: ["Đoạn này viết theo API Spring Data Elasticsearch 5.x (Spring Boot 3.x); chưa được biên dịch hay chạy trong bài này."],
            takeaway: "Repository cho việc đơn giản, NativeQuery cho query thật",
          },
        ],
        conclusion: "**Kết luận:** Spring Data lo phần kết nối và ánh xạ; mapping, analyzer và alias vẫn nên được quản lý có chủ đích.",
      },
      drill: {
        choices: ["PostgreSQL full-text là đủ", "Nên dùng Elasticsearch", "Không phải bài toán tìm kiếm"],
        items: [
          { q: "Admin tìm khách hàng theo tên trong 50.000 bản ghi, cần gõ không dấu", a: "PostgreSQL full-text là đủ", why: "Dữ liệu nhỏ, `unaccent` + `tsvector` + GIN hoặc `pg_trgm` giải quyết được, không cần thêm hệ thống và pipeline đồng bộ." },
          { q: "Sàn thương mại 20 triệu sản phẩm, tìm có gợi ý khi gõ, chịu gõ sai, facet theo thương hiệu, giá, đánh giá", a: "Nên dùng Elasticsearch", why: "Fuzzy, autocomplete, aggregation nhiều chiều trên dữ liệu lớn và tách tải đọc là thế mạnh của ES." },
          { q: "Trừ tồn kho khi đặt hàng, phải đảm bảo không bán quá số lượng", a: "Không phải bài toán tìm kiếm", why: "Cần transaction và điều kiện nguyên tử trên DB chính. ES không có transaction nhiều tài liệu và đọc có độ trễ." },
          { q: "Tìm kiếm và thống kê trên hàng tỷ dòng log ứng dụng theo thời gian", a: "Nên dùng Elasticsearch", why: "Đây là bài toán log analytics kinh điển của ES/OpenSearch, index theo thời gian kèm aggregation." },
        ],
        summary: "Tìm kiếm đơn giản trên dữ liệu vừa: Postgres. Tìm kiếm phức tạp hoặc tải lớn: ES làm bản sao. Dữ liệu cần đúng tuyệt đối: DB chính.",
      },
      takeaway: {
        lines: [
          "Elasticsearch là bản sao để tìm kiếm, không phải nguồn sự thật: không ACID nhiều tài liệu, near real-time, không ràng buộc.",
          "Dữ liệu vừa và nhu cầu đơn giản thì PostgreSQL full-text trước.",
        ],
      },
      trap: {
        title: "Đọc lại từ ES để ra quyết định nghiệp vụ",
        text: "Kiểm tra \"còn hàng không\" hay \"đơn đã thanh toán chưa\" bằng search trên ES có thể đọc bản cũ vài giây. Quyết định nghiệp vụ đọc từ DB chính; ES chỉ dùng để tìm và hiển thị.",
      },
      quiz: {
        question: "Đội đề xuất bỏ PostgreSQL, lưu đơn hàng thẳng vào Elasticsearch cho \"nhanh\". Phản biện chính là gì?",
        options: [
          "Elasticsearch không lưu được JSON lồng nhau",
          "Elasticsearch không có transaction nhiều tài liệu, không có ràng buộc, đọc qua search là near real-time: không hợp làm nguồn sự thật cho đơn hàng",
          "Elasticsearch không chạy được trên Docker",
          "Elasticsearch không có Spring client",
        ],
        answer: 1,
        explain: "Đơn hàng cần tính đúng đắn: tạo đơn và trừ kho cùng thành công hoặc cùng thất bại, không trùng mã đơn. ES làm tốt việc tìm kiếm trên bản sao, không thay được DB giao dịch.",
      },
    },
  ],
  modelAnswer:
    "Em dùng Elasticsearch như một bản sao để tìm kiếm, còn PostgreSQL vẫn là nguồn sự thật. Lõi của nó là inverted index: analyzer tách văn bản thành token, với tiếng Việt em dùng tokenizer standard cộng lowercase và asciifolding để người dùng gõ không dấu vẫn ra. Mapping em khai tường minh: tên là text để match, kèm multi-field keyword để sort và lọc chính xác; status là keyword. Query em để chữ người dùng gõ trong must, còn status, giá, quyền xem trong filter vì không tính điểm và được cache; phân trang sâu thì dùng search_after thay cho from size, vì mặc định bị chặn ở mười nghìn. Số primary shard chốt khi tạo index vì routing là hash chia lấy dư, replica thì đổi được; dữ liệu hiện ra sau refresh khoảng một giây. Đồng bộ em không dual write mà dùng outbox hoặc Debezium qua Kafka, indexer dùng id trong DB làm _id và version ngoài để event cũ không ghi đè bản mới. Đổi mapping thì tạo index mới, nạp lại rồi đổi alias nguyên tử. Dữ liệu nhỏ thì em dùng luôn full-text của Postgres.",
  cards: [
    { q: "Inverted index lưu gì?", a: "Từ (token) trỏ tới danh sách tài liệu chứa nó, kèm vị trí và tần suất để xếp hạng." },
    { q: "Analyzer gồm những bước nào?", a: "Character filter (tuỳ chọn), đúng một tokenizer, rồi các token filter. Chạy cả lúc index và lúc search (với match)." },
    { q: "Làm sao gõ không dấu vẫn tìm ra tiếng Việt có dấu?", a: "Thêm token filter `asciifolding` (sau `lowercase`) vào analyzer dùng cho cả index và search; `Điện` thành `dien`." },
    { q: "text khác keyword thế nào?", a: "text qua analyzer, dùng tìm toàn văn. keyword lưu nguyên văn, dùng filter, sort, aggregation, phân biệt hoa thường." },
    { q: "term trên field text có vấn đề gì?", a: "Term không qua analyzer nên chuỗi gốc không trùng token đã chuẩn hoá: thường ra 0 kết quả." },
    { q: "Vì sao điều kiện có/không nên đặt trong filter?", a: "Không tính điểm, có thể được cache, và không làm nhiễu xếp hạng." },
    { q: "BM25 dựa trên những yếu tố nào?", a: "Tần suất từ trong tài liệu (có bão hoà), độ hiếm của từ trong index (IDF), và độ dài field." },
    { q: "Vì sao from + size bị giới hạn 10.000, thay bằng gì?", a: "Mỗi shard phải trả top from + size để gộp, càng sâu càng tốn. Dùng search_after với sort duy nhất, kèm PIT nếu cần ảnh chụp nhất quán." },
    { q: "Vì sao số primary shard không đổi được?", a: "Routing là hash(_routing) chia lấy dư cho số primary; đổi số chia thì tài liệu cũ nằm sai shard. Đổi bằng reindex hoặc split/shrink." },
    { q: "Near real-time nghĩa là gì?", a: "Tài liệu mới chỉ search thấy sau refresh (mặc định khoảng 1 giây). GET theo id thì thấy ngay; độ bền do translog đảm bảo." },
    { q: "Đồng bộ DB sang ES đúng cách?", a: "Không dual write. Outbox hoặc CDC (Debezium) lên Kafka, indexer dùng _id = id DB và version_type=external để idempotent và đúng thứ tự." },
    { q: "Reindex không downtime?", a: "App dùng alias. Tạo index mới với mapping đầy đủ, nạp dữ liệu, bắt kịp thay đổi, đổi alias bằng một request _aliases nguyên tử." },
  ],
};
