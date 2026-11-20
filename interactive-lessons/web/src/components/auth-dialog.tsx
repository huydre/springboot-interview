import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";
import { closeAuth, getAuthUi, subscribeAuthUi, type AuthTab } from "../lib/auth-ui";
import { toast } from "../lib/toast";
import { displayName } from "../auth/use-auth";
import { Avatar } from "./ui/avatar";

const VI_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "Email hoặc mật khẩu chưa đúng."],
  [/already registered|already been registered/i, "Email này đã có tài khoản, hãy đăng nhập."],
  [/password should be at least/i, "Mật khẩu cần ít nhất 6 ký tự."],
  [/email not confirmed/i, "Bạn chưa xác nhận email. Hãy mở thư xác nhận rồi đăng nhập lại."],
  [/rate limit|too many/i, "Bạn thử quá nhiều lần, hãy chờ một lúc rồi thử lại."],
  [/valid email|invalid.*email|email address .* is invalid/i, "Email chưa hợp lệ hoặc không được hỗ trợ."],
];
const viError = (m: string) => VI_ERRORS.find(([re]) => re.test(m))?.[1] ?? m;

const PERKS = [
  ["Lưu tiến độ", "Phần đã học đi theo bạn trên mọi thiết bị."],
  ["Ghi chú riêng", "Viết lại điều cần nhớ cho từng phần."],
  ["Hỏi đáp", "Đặt câu hỏi và góp ý ngay dưới mỗi bài."],
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="au-field"><span>{label}</span>{children}</label>;
}

/** The one shared sign-in / sign-up dialog: brand panel on the left, form on the right. Opened with openAuth(). */
export function AuthDialog() {
  const ui = useSyncExternalStore(subscribeAuthUi, getAuthUi);
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<AuthTab>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ui.open && !d.open) { setTab(ui.tab); setShow(false); d.showModal(); }
    if (!ui.open && d.open) d.close();
  }, [ui]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    const res = tab === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() || undefined }, emailRedirectTo: location.origin } });
    setBusy(false);
    if (res.error) { toast.error(tab === "in" ? "Chưa đăng nhập được" : "Chưa tạo được tài khoản", viError(res.error.message)); return; }
    if (tab === "up" && !res.data.session) {
      toast.info("Kiểm tra email của bạn", "Mình đã gửi thư xác nhận. Mở thư rồi quay lại đăng nhập.");
      setTab("in"); setPassword("");
      return;
    }
    const user = res.data.user ?? res.data.session?.user;
    toast.success(tab === "in" ? "Đăng nhập thành công" : "Chào mừng bạn", user ? `Xin chào, ${displayName(user)}.` : undefined);
    setPassword("");
    closeAuth();
  };

  const signIn = tab === "in";
  return (
    <dialog ref={ref} className="auth" onClose={closeAuth} onClick={(e) => { if (e.target === ref.current) closeAuth(); }} aria-labelledby="auth-title">
      <div className="au-shell">
        <aside className="au-brand">
          <a className="logo" href={location.pathname}>Interview<b>Lab</b></a>
          <div className="au-hero"><Avatar seed="interviewlab" size={120} /></div>
          <h3>Học chắc, nhớ lâu</h3>
          <ul>
            {PERKS.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
          </ul>
        </aside>

        <form className="au-form" onSubmit={submit}>
          <button type="button" className="au-close" aria-label="Đóng" onClick={closeAuth}>×</button>
          <h2 id="auth-title">{signIn ? "Chào mừng trở lại" : "Tạo tài khoản"}</h2>
          <p className="au-sub">{signIn ? "Đăng nhập để tiếp tục việc học của bạn." : "Miễn phí, chỉ mất một phút."}</p>

          <div className="au-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={signIn} className={signIn ? "on" : ""} onClick={() => setTab("in")}>Đăng nhập</button>
            <button type="button" role="tab" aria-selected={!signIn} className={!signIn ? "on" : ""} onClick={() => setTab("up")}>Đăng ký</button>
          </div>

          {!signIn && <Field label="Tên hiển thị"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ví dụ: Nam" autoComplete="nickname" /></Field>}
          <Field label="Email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" autoComplete="email" /></Field>
          <Field label="Mật khẩu">
            <span className="au-pass">
              <input type={show ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signIn ? "Mật khẩu của bạn" : "Ít nhất 6 ký tự"} autoComplete={signIn ? "current-password" : "new-password"} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{show ? "Ẩn" : "Hiện"}</button>
            </span>
          </Field>

          <button className="btn primary au-submit" disabled={busy}>{busy ? "Đang xử lý…" : signIn ? "Đăng nhập" : "Tạo tài khoản"}</button>
          <p className="au-switch">
            {signIn ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button type="button" onClick={() => setTab(signIn ? "up" : "in")}>{signIn ? "Đăng ký" : "Đăng nhập"}</button>
          </p>
        </form>
      </div>
    </dialog>
  );
}
