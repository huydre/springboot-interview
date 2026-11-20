import { useState } from "react";

/** Tables, columns and the 17 foreign keys below were read from pg_constraint / information_schema on the T24 dataset. */
type Table = { name: string; x: number; y: number; note: string; pk: string; cols: string[] };

const W = 168;
const H = 38;

const TABLES: Table[] = [
  { name: "sector", x: 20, y: 30, note: "nhóm khách hàng", pk: "sector_id", cols: ["sector_id", "description"] },
  { name: "company", x: 260, y: 30, note: "chi nhánh", pk: "company_id", cols: ["company_id", "name", "city", "open_date"] },
  { name: "category", x: 560, y: 30, note: "loại sản phẩm", pk: "category_id", cols: ["category_id", "description", "product_group"] },
  { name: "account_officer", x: 20, y: 170, note: "cán bộ quản lý khách", pk: "officer_id", cols: ["officer_id", "name", "company_id"] },
  {
    name: "customer", x: 260, y: 170, note: "khách hàng", pk: "customer_id",
    cols: ["customer_id", "short_name", "full_name", "sector_id", "gender", "birth_date", "city", "mobile", "email", "customer_status", "account_officer_id", "company_id", "created_date"],
  },
  {
    name: "account", x: 560, y: 170, note: "tài khoản", pk: "account_id",
    cols: ["account_id", "customer_id", "category_id", "ccy", "company_id", "open_date", "close_date", "working_balance", "status"],
  },
  { name: "currency", x: 790, y: 170, note: "loại tiền", pk: "ccy", cols: ["ccy", "name", "decimals"] },
  {
    name: "loan", x: 790, y: 320, note: "khoản vay", pk: "ld_id",
    cols: ["ld_id", "customer_id", "account_id", "principal", "ccy", "interest_rate", "start_date", "maturity_date", "status"],
  },
  {
    name: "funds_transfer", x: 560, y: 320, note: "lệnh chuyển khoản", pk: "ft_id",
    cols: ["ft_id", "debit_account", "credit_account", "amount", "ccy", "processing_date", "status", "narrative"],
  },
  { name: "txn_type", x: 20, y: 470, note: "loại giao dịch", pk: "txn_code", cols: ["txn_code", "description", "dr_cr"] },
  {
    name: "stmt_entry", x: 260, y: 470, note: "bút toán sao kê", pk: "stmt_entry_id",
    cols: ["stmt_entry_id", "account_id", "txn_code", "amount", "booking_date", "value_date", "ft_id", "narrative"],
  },
];

/** child.col references parent: the "1" end sits at the parent, the "N" end at the child. */
type Fk = { child: string; col: string; parent: string; shift?: number };
const FKS: Fk[] = [
  { child: "account_officer", col: "company_id", parent: "company" },
  { child: "customer", col: "sector_id", parent: "sector" },
  { child: "customer", col: "account_officer_id", parent: "account_officer" },
  { child: "customer", col: "company_id", parent: "company" },
  { child: "account", col: "customer_id", parent: "customer" },
  { child: "account", col: "category_id", parent: "category" },
  { child: "account", col: "ccy", parent: "currency" },
  { child: "account", col: "company_id", parent: "company" },
  { child: "funds_transfer", col: "debit_account", parent: "account", shift: -18 },
  { child: "funds_transfer", col: "credit_account", parent: "account", shift: 18 },
  { child: "funds_transfer", col: "ccy", parent: "currency" },
  { child: "stmt_entry", col: "account_id", parent: "account" },
  { child: "stmt_entry", col: "txn_code", parent: "txn_type" },
  { child: "stmt_entry", col: "ft_id", parent: "funds_transfer" },
  { child: "loan", col: "customer_id", parent: "customer" },
  { child: "loan", col: "account_id", parent: "account" },
  { child: "loan", col: "ccy", parent: "currency" },
];

const byName = (n: string) => TABLES.find((t) => t.name === n) as Table;
const center = (t: Table) => ({ x: t.x + W / 2, y: t.y + H / 2 });

/** Point where the line from the box center toward `to` leaves the box border. */
function edgePoint(t: Table, to: { x: number; y: number }, shift: number) {
  const c = center(t);
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  const k = Math.min(dx === 0 ? Infinity : W / 2 / Math.abs(dx), dy === 0 ? Infinity : H / 2 / Math.abs(dy));
  const p = { x: c.x + dx * k, y: c.y + dy * k };
  // Shift sideways along the border so two links between the same pair do not overlap.
  return Math.abs(dy) * (W / 2) > Math.abs(dx) * (H / 2) ? { x: p.x + shift, y: p.y } : { x: p.x, y: p.y + shift };
}

/** A marker placed on the line, a few pixels away from its end. */
function marker(from: { x: number; y: number }, end: { x: number; y: number }, gap: number) {
  const len = Math.hypot(end.x - from.x, end.y - from.y) || 1;
  const ux = (end.x - from.x) / len;
  const uy = (end.y - from.y) / len;
  return { x: end.x - ux * gap - uy * 9, y: end.y - uy * gap + ux * 9 };
}

export function SqlErdViewerWidget() {
  const [sel, setSel] = useState<string>("account");
  const t = byName(sel);
  const out = FKS.filter((f) => f.child === sel); // this table points to its parents
  const inn = FKS.filter((f) => f.parent === sel); // other tables point to this one
  const related = new Set([sel, ...out.map((f) => f.parent), ...inn.map((f) => f.child)]);
  const fkCols = new Set(out.map((f) => f.col));
  const select = (n: string) => setSel(n);

  return (
    <div className="widget">
      <p className="muted">Bấm vào một bảng: các đường nối của bảng đó được tô đậm, các bảng không liên quan mờ đi. Đầu <b>1</b> nằm ở bảng được trỏ tới (khoá chính), đầu <b>N</b> nằm ở bảng giữ khoá ngoại.</p>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--code-bg)" }}>
        <svg viewBox="0 0 990 530" role="group" aria-label="ERD 11 bảng T24" style={{ display: "block", width: "100%", minWidth: 760, height: "auto" }}>
          {FKS.map((f) => {
            const c = byName(f.child);
            const p = byName(f.parent);
            const a = edgePoint(c, center(p), f.shift ?? 0);
            const b = edgePoint(p, center(c), f.shift ?? 0);
            const active = f.child === sel || f.parent === sel;
            const dim = sel !== "" && !active;
            const color = active ? "var(--blue)" : "var(--muted)";
            const mn = marker(b, a, 10);
            const m1 = marker(a, b, 10);
            return (
              <g key={`${f.child}.${f.col}`} opacity={dim ? 0.25 : 1}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={active ? 2.2 : 1.3} />
                <text x={mn.x} y={mn.y} fontSize="12" fontWeight="700" fill={color} textAnchor="middle" dominantBaseline="middle">N</text>
                <text x={m1.x} y={m1.y} fontSize="12" fontWeight="700" fill={color} textAnchor="middle" dominantBaseline="middle">1</text>
              </g>
            );
          })}
          {TABLES.map((tb) => {
            const on = tb.name === sel;
            const dim = !related.has(tb.name);
            return (
              <g
                key={tb.name}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                aria-label={`Bảng ${tb.name}`}
                onClick={() => select(tb.name)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(tb.name); } }}
                style={{ cursor: "pointer", outline: "none" }}
                opacity={dim ? 0.35 : 1}
              >
                <rect x={tb.x} y={tb.y} width={W} height={H} rx={8} fill={on ? "color-mix(in srgb, var(--blue) 16%, var(--panel))" : "var(--panel)"} stroke={on ? "var(--blue)" : "var(--line)"} strokeWidth={on ? 2.2 : 1.4} />
                <text x={tb.x + 10} y={tb.y + 16} fontSize="13" fontWeight="700" fontFamily="var(--mono)" fill="var(--ink)">{tb.name}</text>
                <text x={tb.x + 10} y={tb.y + 31} fontSize="11" fill="var(--muted)">{tb.note}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="two">
        <div>
          <h5 style={{ margin: "0 0 8px" }}>Cột của <code>{t.name}</code> ({t.cols.length} cột)</h5>
          <ul className="log">
            {t.cols.map((c) => (
              <li key={c}>
                {c}{" "}
                {c === t.pk && <b style={{ color: "var(--amber)" }}>PK</b>}
                {fkCols.has(c) && <b style={{ color: "var(--blue)" }}>FK</b>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 style={{ margin: "0 0 8px" }}>Quan hệ của <code>{t.name}</code></h5>
          <ul className="log">
            {out.length === 0 && <li>Không giữ khoá ngoại nào: đây là bảng danh mục, chỉ được trỏ tới.</li>}
            {out.map((f) => (
              <li key={f.col}>
                {f.col} → {f.parent}.{byName(f.parent).pk}
                <br />
                <small className="muted">Mỗi dòng {f.child} thuộc đúng 1 dòng {f.parent}.</small>
              </li>
            ))}
            {inn.map((f) => (
              <li key={`${f.child}.${f.col}`}>
                {f.child}.{f.col} → {t.pk}
                <br />
                <small className="muted">Một dòng {t.name} có thể có nhiều dòng {f.child}.</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="result good">
        {out.length} khoá ngoại đi ra, {inn.length} khoá ngoại đi vào
        <small>Tổng cộng 17 khoá ngoại trong 11 bảng. <code>funds_transfer</code> trỏ tới <code>account</code> hai lần (tài khoản gửi và tài khoản nhận).</small>
      </div>
    </div>
  );
}
