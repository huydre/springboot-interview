import { useState } from "react";

/**
 * Keep the column bare: a predicate on a bare column is one interval of the sorted keys; a predicate on a function of the column
 * makes the database compute that function for every key. The key lists are tiny samples to show the shape, not real data.
 */
type Key = { raw: string; computed: string; match: boolean };
type Fix = { id: string; label: string; sql: string; kind: "interval" | "expr" | "none"; note: string };
type Case = {
  id: string;
  label: string;
  sql: string;
  keys: Key[];
  /** Keys in the order an index on the expression would store them (only for cases with an expression index). */
  exprOrder?: Key[];
  fixes: Fix[];
};

const k = (raw: string, computed: string, match: boolean): Key => ({ raw, computed, match });

const CASES: Case[] = [
  {
    id: "year",
    label: "EXTRACT(YEAR FROM booking_date) = 2024",
    sql: "WHERE EXTRACT(YEAR FROM booking_date) = 2024",
    keys: ["2023-08", "2023-10", "2023-12", "2024-01", "2024-03", "2024-05", "2024-07", "2024-09", "2024-11", "2024-12", "2025-02", "2025-04"].map((d) => k(d, d.slice(0, 4), d.startsWith("2024"))),
    fixes: [
      { id: "rewrite", label: "Viết lại thành khoảng", kind: "interval", sql: "WHERE booking_date >= DATE '2024-01-01'\n  AND booking_date <  DATE '2025-01-01'", note: "Dùng < đầu năm sau để không sót ngày 31/12." },
      { id: "expr", label: "Index trên biểu thức", kind: "expr", sql: "CREATE INDEX ON t ((EXTRACT(YEAR FROM booking_date)));", note: "Index lưu sẵn kết quả hàm, câu truy vấn phải giữ đúng biểu thức đó." },
    ],
  },
  {
    id: "date",
    label: "posted_at::date = '2024-03-15'",
    sql: "WHERE posted_at::date = DATE '2024-03-15'",
    keys: ["03-14 22h", "03-15 03h", "03-15 09h", "03-15 18h", "03-16 01h", "03-16 12h", "03-17 07h", "03-18 20h"].map((d) => k(d, d.slice(0, 5), d.startsWith("03-15"))),
    fixes: [
      { id: "rewrite", label: "Viết lại thành khoảng", kind: "interval", sql: "WHERE posted_at >= TIMESTAMP '2024-03-15'\n  AND posted_at <  TIMESTAMP '2024-03-16'", note: "Một ngày là nửa khoảng [đầu ngày, đầu ngày sau)." },
      { id: "expr", label: "Index trên biểu thức", kind: "expr", sql: "CREATE INDEX ON t ((posted_at::date));", note: "Ép timestamp sang date thì hợp lệ trong index, ép sang timestamptz thì không (phụ thuộc time zone)." },
    ],
  },
  {
    id: "coalesce",
    label: "COALESCE(fee, 0) > 100",
    sql: "WHERE COALESCE(fee, 0) > 100",
    keys: [k("5", "5", false), k("20", "20", false), k("80", "80", false), k("120", "120", true), k("300", "300", true), k("NULL", "0", false), k("NULL", "0", false)],
    fixes: [
      { id: "rewrite", label: "Bỏ COALESCE", kind: "interval", sql: "WHERE fee > 100", note: "NULL > 100 cho kết quả không đúng nên dòng NULL cũng bị loại, kết quả giống hệt. Với = 0 thì khác: phải viết (fee = 0 OR fee IS NULL)." },
    ],
  },
  {
    id: "arith",
    label: "entry_id + 1 = 12346",
    sql: "WHERE entry_id + 1 = 12346",
    keys: [12343, 12344, 12345, 12346, 12347, 12348].map((v) => k(String(v), String(v + 1), v + 1 === 12346)),
    fixes: [
      { id: "rewrite", label: "Chuyển phép tính sang vế hằng số", kind: "interval", sql: "WHERE entry_id = 12345", note: "Chỉ chuyển được khi vế kia là hằng số. Với a + 1 = b (cả hai là cột) thì không chuyển được." },
    ],
  },
  (() => {
    const keys = [k("An@x.com", "an@x.com", true), k("Binh@x.com", "binh@x.com", false), k("Chi@x.com", "chi@x.com", false), k("an@x.com", "an@x.com", true), k("binh@x.com", "binh@x.com", false), k("chi@x.com", "chi@x.com", false)];
    return {
      id: "lower",
      label: "LOWER(email) = 'an@x.com'",
      sql: "WHERE LOWER(email) = 'an@x.com'",
      keys,
      exprOrder: [...keys].sort((x, y) => (x.computed < y.computed ? -1 : x.computed > y.computed ? 1 : x.raw < y.raw ? -1 : 1)),
      fixes: [
        { id: "expr", label: "Index trên biểu thức", kind: "expr", sql: "CREATE INDEX ON users (LOWER(email));", note: "Hai email khác hoa thường nằm cạnh nhau trong index này. Cách khác: kiểu CITEXT." },
      ],
    } satisfies Case;
  })(),
  {
    id: "like",
    label: "email LIKE '%ab'",
    sql: "WHERE email LIKE '%ab'",
    keys: ["an@ab", "bao@x", "cab", "dung@ab", "eab", "giang@x", "hab"].map((d) => k(d, d, d.endsWith("ab"))),
    fixes: [
      { id: "none", label: "Không có cách viết lại", kind: "none", sql: "-- cần index trigram (pg_trgm), cấu trúc khác B-tree", note: "Phần đuôi không cho biết bắt đầu tìm ở đâu trong cây đã sắp. Nếu chỉ biết phần đầu (LIKE 'ab%') thì vẫn là một đoạn liền." },
    ],
  },
];

export function SargableRewriteWidget() {
  const [ci, setCi] = useState(0);
  const [fixId, setFixId] = useState<string>("none-applied");
  const c = CASES[ci];
  const fix = c.fixes.find((f) => f.id === fixId);
  const kind = fix?.kind ?? "scan";
  const useExpr = kind === "expr" && c.exprOrder ? c.exprOrder : c.keys;
  const showComputed = kind === "scan" || kind === "none" || kind === "expr";
  const firstMatch = useExpr.findIndex((x) => x.match);
  const lastMatch = useExpr.length - 1 - [...useExpr].reverse().findIndex((x) => x.match);
  const contiguous = useExpr.slice(firstMatch, lastMatch + 1).every((x) => x.match);
  const oneInterval = (kind === "interval" || kind === "expr") && contiguous;
  const matched = c.keys.filter((x) => x.match).length;
  const plan = oneInterval ? "Index Scan" : "Seq Scan";

  const pickCase = (i: number) => { setCi(i); setFixId("none-applied"); };

  return (
    <div className="widget">
      <div className="race-controls">
        <div className="wx-grow">
          <small>Điều kiện của câu truy vấn</small>
          <div className="seg small" role="group" aria-label="Chọn điều kiện">
            {CASES.map((x, i) => <button key={x.id} className={ci === i ? "on" : ""} aria-pressed={ci === i} onClick={() => pickCase(i)}>{x.label}</button>)}
          </div>
        </div>
        <div>
          <small>Cách xử lý</small>
          <div className="seg small" role="group" aria-label="Chọn cách xử lý">
            <button className={fixId === "none-applied" ? "on" : ""} aria-pressed={fixId === "none-applied"} onClick={() => setFixId("none-applied")}>Giữ nguyên</button>
            {c.fixes.map((f) => <button key={f.id} className={fixId === f.id ? "on" : ""} aria-pressed={fixId === f.id} onClick={() => setFixId(f.id)}>{f.label}</button>)}
          </div>
        </div>
      </div>

      <pre className="wx-code">{fix && fix.kind !== "none" ? fix.sql : c.sql}</pre>

      <p className="wx-cap">
        {kind === "expr" ? "Các key trong index trên biểu thức, xếp theo kết quả hàm" : "Các key trong index trên cột gốc, xếp theo giá trị của cột"}:
      </p>
      <ol className="wx-keys" aria-label="Danh sách key của index">
        {useExpr.map((x, i) => {
          const inRange = oneInterval && i >= firstMatch && i <= lastMatch;
          const crossed = !oneInterval;
          return (
            <li key={`${x.raw}-${i}`} className={`${inRange ? "range" : ""} ${crossed ? "crossed" : ""} ${x.match ? "match" : ""}`}>
              <b>{kind === "expr" ? x.computed : x.raw}</b>
              {showComputed && crossed && <em>{kind === "expr" ? x.raw : `ƒ = ${x.computed}`}</em>}
              <span className="sr-only">{x.match ? " khớp" : " không khớp"}</span>
            </li>
          );
        })}
      </ol>
      <div className="wx-legend">
        <span><i className="range" /> đoạn liền database đọc</span>
        <span><i className="crossed" /> phải tính hàm cho từng key rồi mới biết khớp hay không</span>
        <span><i className="match" /> khớp</span>
      </div>

      <div className="race-sum">
        <div><small>Plan</small><b className={oneInterval ? "good" : "bad"}>{plan}</b><span>{oneInterval ? "đi xuống cây một lần tới đầu đoạn" : "không biết đoạn nào chứa kết quả, đọc hết"}</span></div>
        <div><small>Key phải xét</small><b>{oneInterval ? `${matched} (và 1 key chặn cuối)` : `${c.keys.length} / ${c.keys.length}`}</b><span>{oneInterval ? "chỉ các key trong đoạn" : "mỗi key chạy lại hàm hoặc phép tính"}</span></div>
        <div><small>Ghi chú</small><b>{fix ? "Có cách" : "Hiện tại"}</b><span>{fix ? fix.note : kind === "scan" ? "Cột bị bọc trong hàm hoặc phép tính, index trên cột gốc không dùng được." : ""}</span></div>
      </div>
      <p className="wx-note">Mô hình đơn giản: vài key mẫu để thấy hình dạng. Plan Seq Scan hay Index Scan thật còn phụ thuộc thống kê và độ chọn lọc.</p>
    </div>
  );
}
