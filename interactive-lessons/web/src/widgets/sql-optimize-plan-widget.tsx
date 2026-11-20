import { useEffect, useState } from "react";
import { runSql } from "../lib/sql-engine";
import { Code } from "../components/code-block";

const QUERY = "SELECT * FROM plan_demo WHERE entry_id = 12345";

const BUILD = `DROP TABLE IF EXISTS plan_demo;
CREATE TABLE plan_demo AS
SELECT g AS entry_id,
       'AC' || lpad((g % 3000)::text, 8, '0') AS account_id,
       (g % 9 + 1) * 1000 AS amount
FROM generate_series(1, 30000) AS g;
ANALYZE plan_demo;`;

type Plans = { without: string[]; withIndex: string[] };

let cached: Promise<Plans> | null = null;

const planOf = async (): Promise<string[]> => (await runSql(`EXPLAIN ${QUERY}`)).rows.map((r) => String(r[0]));

/** Builds a scratch table, reads the real EXPLAIN before and after CREATE INDEX, then drops the table. Runs once and is shared. */
function loadPlans(): Promise<Plans> {
  cached ??= (async () => {
    try {
      await runSql(BUILD);
      const without = await planOf();
      await runSql("CREATE INDEX idx_plan_demo_entry_id ON plan_demo (entry_id); ANALYZE plan_demo;");
      const withIndex = await planOf();
      return { without, withIndex };
    } finally {
      await runSql("DROP TABLE IF EXISTS plan_demo").catch(() => undefined);
    }
  })().catch((e: unknown) => {
    cached = null;
    throw e;
  });
  return cached;
}

const COST = /\(cost=([\d.]+)\.\.([\d.]+) rows=(\d+) width=(\d+)\)/;

/** Plain-language reading of one plan line. */
function explainLine(raw: string): string {
  const line = raw.trim().replace(/^->\s*/, "");
  const m = COST.exec(line);
  const costs = m
    ? ` Ước lượng: chi phí từ ${m[1]} đến ${m[2]} (đơn vị tương đối, không phải giây), khoảng ${m[3]} dòng được trả ra.`
    : "";
  let s: RegExpExecArray | null;
  if ((s = /^Seq Scan on (\w+)/.exec(line))) return `Seq Scan: đọc lần lượt cả bảng ${s[1]}, từ dòng đầu tới dòng cuối.${costs}`;
  if ((s = /^Index Only Scan using (\w+) on (\w+)/.exec(line))) return `Index Only Scan: lấy kết quả ngay từ index ${s[1]}, không cần mở bảng ${s[2]}.${costs}`;
  if ((s = /^Index Scan using (\w+) on (\w+)/.exec(line))) return `Index Scan: tra index ${s[1]} để nhảy thẳng tới dòng cần, rồi lấy dòng đó trong bảng ${s[2]}.${costs}`;
  if ((s = /^Bitmap Index Scan on (\w+)/.exec(line))) return `Bitmap Index Scan: dùng index ${s[1]} để đánh dấu những trang chứa dòng cần tìm.${costs}`;
  if ((s = /^Bitmap Heap Scan on (\w+)/.exec(line))) return `Bitmap Heap Scan: mở đúng những trang đã đánh dấu của bảng ${s[1]} và lấy dòng.${costs}`;
  if (/^Sort/.test(line)) return `Sort: sắp xếp kết quả.${costs}`;
  if (/^Filter:/.test(line)) return "Filter: điều kiện kiểm tra từng dòng sau khi đọc. Dòng không khớp bị bỏ, nên mọi dòng của bảng vẫn phải được đọc.";
  if (/^Index Cond:/.test(line)) return "Index Cond: điều kiện được dùng ngay trong index để tìm dòng, không phải duyệt cả bảng.";
  return costs.trim();
}

const cell = { padding: "8px 12px", verticalAlign: "top", borderBottom: "1px solid var(--line)" } as const;

/** Toggle between "no index" and "with index" and read the real EXPLAIN text of a lookup next to a plain-language reading. */
export function SqlOptimizePlanWidget() {
  const [plans, setPlans] = useState<Plans | null>(null);
  const [failed, setFailed] = useState(false);
  const [indexed, setIndexed] = useState(false);

  useEffect(() => {
    let live = true;
    loadPlans().then((p) => live && setPlans(p), () => live && setFailed(true));
    return () => { live = false; };
  }, []);

  const lines = plans ? (indexed ? plans.withIndex : plans.without) : [];
  const totals = plans ? [plans.without, plans.withIndex].map((p) => COST.exec(p[0])?.[2] ?? "?") : [];

  return (
    <div className="widget">
      <p className="muted">
        Widget tự tạo bảng thử <code>plan_demo</code> có 30.000 dòng, chạy <code>EXPLAIN</code> trước và sau <code>CREATE INDEX</code>, rồi xoá bảng. Văn bản kế hoạch bên dưới là kết quả thật của PostgreSQL.
      </p>
      <div className="seg small">
        <button className={!indexed ? "on" : ""} onClick={() => setIndexed(false)}>Không có index</button>
        <button className={indexed ? "on" : ""} onClick={() => setIndexed(true)}>Có index</button>
      </div>
      <Code>{`EXPLAIN ${QUERY};${indexed ? "\n-- sau: CREATE INDEX idx_plan_demo_entry_id ON plan_demo (entry_id);" : ""}`}</Code>

      {!plans && !failed && <div className="result">Đang tạo bảng thử và chạy EXPLAIN...</div>}
      {failed && <div className="result bad">Không chạy được EXPLAIN. Tải lại trang để thử lại.</div>}
      {plans && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ ...cell, textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>Dòng của kế hoạch (EXPLAIN)</th>
                  <th style={{ ...cell, textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>Đọc bằng lời thường</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={`${indexed}-${i}`}>
                    <td style={{ ...cell, fontFamily: "var(--mono)", fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word", width: "50%", background: "var(--panel-2)" }}>{l}</td>
                    <td style={cell}>{explainLine(l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`result ${indexed ? "good" : "warn"}`}>
            {indexed ? `Có index: chi phí ước lượng tổng ${totals[1]}.` : `Không có index: chi phí ước lượng tổng ${totals[0]}.`}
            <small>
              {indexed
                ? `Trước đó là ${totals[0]}. Chi phí là con số ước lượng của planner để so sánh các cách chạy, không phải thời gian thật.`
                : "PostgreSQL không có cách nào khác ngoài đọc cả bảng 30.000 dòng để tìm một dòng. Bấm \"Có index\" để so sánh."}
            </small>
          </div>
        </>
      )}
    </div>
  );
}
