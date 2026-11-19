import { useState } from "react";

const THEMES = [
  "Vấn đề kỹ thuật khó nhất",
  "Bất đồng kỹ thuật",
  "Deadline gấp",
  "Mắc lỗi và khắc phục",
  "Học nhanh công nghệ mới",
  "Chủ động cải thiện",
  "Giúp đỡ người khác",
  "Nhận feedback tiêu cực",
  "Đánh đổi chất lượng và tốc độ",
];
const PARTS = [
  { k: "s", label: "S · Bối cảnh (ngắn)" },
  { k: "t", label: "T · Việc của em" },
  { k: "a", label: "A · Em đã làm gì, vì sao (dài nhất)" },
  { k: "r", label: "R · Kết quả đo được" },
  { k: "l", label: "L · Bài học" },
] as const;
type Story = Record<(typeof PARTS)[number]["k"], string>;
const EMPTY: Story = { s: "", t: "", a: "", r: "", l: "" };
const KEY = "star-stories";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Checks taken from the advice in study note 10.03; they are text heuristics, not a grade. */
function checks(st: Story): { ok: boolean; text: string }[] {
  const all = Object.values(st).join(" ");
  return [
    { ok: words(st.a) > Math.max(words(st.s), words(st.t), words(st.r)), text: "Action dài nhất" },
    { ok: !/chúng em|team em|bọn em/i.test(st.a), text: "Action nói \"em\", không \"chúng em\" hay \"team em\"" },
    { ok: /\d/.test(st.r), text: "Result có số liệu (chỉ số bạn đã thật sự đo)" },
    { ok: /thay vì|so sánh|phương án|cân nhắc|thử/i.test(st.a), text: "Action có phương án đã cân nhắc" },
    { ok: words(st.l) > 0, text: "Có bài học hoặc thay đổi cách làm" },
    { ok: !/<[^<>]*>/.test(all), text: "Không còn chỗ trống <...>" },
  ];
}

function load(): Record<string, Story> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

/** Fill one STAR story per theme; drafts stay in this browser so they can be rehearsed later. */
export function StarBuilderWidget() {
  const [theme, setTheme] = useState(THEMES[0]);
  const [all, setAll] = useState<Record<string, Story>>(load);
  const st = all[theme] ?? EMPTY;
  const set = (k: keyof Story, v: string) => {
    const next = { ...all, [theme]: { ...st, [k]: v } };
    setAll(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const cs = checks(st);
  const filled = THEMES.filter((t) => all[t] && words(Object.values(all[t]).join(" ")) > 0).length;
  return (
    <div className="widget">
      <div className="seg small">
        {THEMES.map((t) => <button key={t} className={theme === t ? "on" : ""} onClick={() => setTheme(t)}>{t}</button>)}
      </div>
      <p className="muted">Đã có nháp {filled}/{THEMES.length} chủ đề. Chỉ ghi ý chính, đừng học thuộc từng chữ. Nháp lưu trong trình duyệt này.</p>
      <div className="pick">
        {PARTS.map((p) => (
          <label key={p.k} style={{ display: "contents" }}>
            <span>{p.label} · {words(st[p.k])} từ</span>
            <textarea rows={p.k === "a" ? 5 : 2} value={st[p.k]} onChange={(e) => set(p.k, e.target.value)} />
          </label>
        ))}
      </div>
      <ul className="log">{cs.map((c) => <li key={c.text} className={c.ok ? "ok" : "err"}>{c.ok ? "✓" : "✗"} {c.text}</li>)}</ul>
      <p className="muted">Kiểm tra tự động chỉ dò chữ, không chấm nội dung. Cuối cùng vẫn phải nói to, bấm giờ khoảng 2 phút và ghi âm nghe lại.</p>
    </div>
  );
}
