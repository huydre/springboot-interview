import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const VI_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "Email hoặc mật khẩu chưa đúng."],
  [/already registered|already been registered/i, "Email này đã có tài khoản, hãy đăng nhập."],
  [/password should be at least/i, "Mật khẩu cần ít nhất 6 ký tự."],
  [/email not confirmed/i, "Bạn chưa xác nhận email. Hãy mở thư xác nhận rồi đăng nhập lại."],
  [/rate limit|too many/i, "Bạn thử quá nhiều lần, hãy chờ một lúc rồi thử lại."],
  [/valid email|invalid.*email|email address .* is invalid/i, "Email chưa hợp lệ hoặc không được hỗ trợ."],
];
const viError = (m: string) => VI_ERRORS.find(([re]) => re.test(m))?.[1] ?? m;

/** Email + password sign-in / sign-up in a native <dialog>. */
export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(null); setNotice(null);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() || undefined }, emailRedirectTo: location.origin } });
    setBusy(false);
    if (res.error) { setError(viError(res.error.message)); return; }
    if (mode === "up" && !res.data.session) { setNotice("Đã tạo tài khoản. Hãy mở email để xác nhận, rồi quay lại đăng nhập."); setMode("in"); return; }
    setPassword("");
    onClose();
  };

  return (
    <dialog ref={ref} className="auth" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <form onSubmit={submit} className="auth-form">
        <h2>{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
        <p className="muted">Lưu phần đã học, ghi chú riêng và tham gia hỏi đáp ở mỗi bài.</p>
        <div className="seg small">
          <button type="button" className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setError(null); }}>Đăng nhập</button>
          <button type="button" className={mode === "up" ? "on" : ""} onClick={() => { setMode("up"); setError(null); }}>Đăng ký</button>
        </div>
        {mode === "up" && <label>Tên hiển thị<input className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ví dụ: Nam" autoComplete="nickname" /></label>}
        <label>Email<input className="text-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>Mật khẩu<input className="text-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} /></label>
        {error && <div className="result bad">{error}</div>}
        {notice && <div className="result good">{notice}</div>}
        <div className="actions">
          <button className="btn primary" disabled={busy}>{busy ? "Đang xử lý…" : mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</button>
          <button type="button" className="btn ghost" onClick={onClose}>Để sau</button>
        </div>
      </form>
    </dialog>
  );
}
