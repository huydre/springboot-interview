import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, displayName } from "../auth/use-auth";
import { supabase } from "../lib/supabase";
import { openAuth } from "../lib/auth-ui";
import { toast } from "../lib/toast";
import { Avatar } from "./ui/avatar";
import { Select } from "./ui/select";

type Comment = { id: string; user_id: string; author_name: string; body: string; parent_id: string | null; created_at: string; section_id: string | null };
type Section = { id: string; title: string };

const MAX = 2000;

const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
};
const exact = (iso: string) => new Date(iso).toLocaleString("vi-VN");

/** Auto-growing textarea with a character counter; Ctrl/Cmd+Enter sends. */
function Composer({ seed, placeholder, submitLabel, onSend, onCancel, autoFocus, extra }: {
  seed: string; placeholder: string; submitLabel: string; onSend: (body: string) => Promise<boolean>; onCancel?: () => void; autoFocus?: boolean; extra?: React.ReactNode;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const grow = () => { const t = ta.current; if (t) { t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 320)}px`; } };
  useEffect(grow, [body]);
  const send = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await onSend(text);
    setBusy(false);
    if (ok) setBody("");
  };
  const left = MAX - body.length;
  return (
    <div className="cmp">
      <Avatar seed={seed} size={40} />
      <div className="cmp-box">
        <textarea ref={ta} rows={2} maxLength={MAX} value={body} autoFocus={autoFocus} placeholder={placeholder}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); void send(); } }} />
        <div className="cmp-bar">
          {extra}
          <span className={`cmp-count ${left < 100 ? "warn" : ""}`}>{body.length > 0 ? `${left}` : "Ctrl + Enter để gửi"}</span>
          {onCancel && <button type="button" className="btn ghost cmp-cancel" onClick={onCancel}>Huỷ</button>}
          <button type="button" className="btn primary cmp-send" disabled={busy || !body.trim()} onClick={() => void send()}>{busy ? "Đang gửi…" : submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="cm-skel" aria-hidden>{[0, 1].map((i) => <div key={i}><i className="av" /><span><i /><i /><i className="short" /></span></div>)}</div>;
}

/** Public Q&A for a lesson: filter by section, one level of replies, delete with confirmation. */
export function Comments({ lessonSlug, sections }: { lessonSlug: string; sections: Section[] }) {
  const { user, enabled } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [section, setSection] = useState("");
  const [filter, setFilter] = useState("all");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [newest, setNewest] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("comments").select("id, user_id, author_name, body, parent_id, created_at, section_id").eq("lesson_slug", lessonSlug).order("created_at", { ascending: true });
    if (error) { toast.error("Chưa tải được bình luận", "Kiểm tra kết nối rồi tải lại trang."); setItems([]); return; }
    setItems(data as Comment[]);
  }, [lessonSlug]);
  useEffect(() => { void load(); }, [load]);

  const roots = useMemo(() => (items ?? []).filter((c) => !c.parent_id), [items]);
  const replies = useMemo(() => {
    const m: Record<string, Comment[]> = {};
    for (const c of items ?? []) if (c.parent_id) (m[c.parent_id] ??= []).push(c);
    return m;
  }, [items]);
  const sectionTitle = (id: string | null) => sections.find((s) => s.id === id)?.title;
  const countBy = (id: string) => roots.filter((c) => c.section_id === id).length;
  const shown = useMemo(() => {
    const f = roots.filter((c) => filter === "all" ? true : filter === "lesson" ? !c.section_id : c.section_id === filter);
    return newest ? [...f].reverse() : f;
  }, [roots, filter, newest]);

  if (!enabled) return null;

  const send = (parent: string | null) => async (body: string) => {
    if (!supabase || !user) return false;
    const { error } = await supabase.from("comments").insert({ lesson_slug: lessonSlug, section_id: parent ? null : section || null, body, parent_id: parent });
    if (error) { toast.error("Chưa gửi được bình luận", "Thử lại sau ít phút."); return false; }
    toast.success(parent ? "Đã gửi câu trả lời" : "Đã gửi bình luận");
    if (parent) { setReplyTo(null); setOpen((o) => ({ ...o, [parent]: true })); }
    await load();
    return true;
  };
  const remove = async (id: string) => {
    const { error } = await supabase!.from("comments").delete().eq("id", id);
    setConfirm(null);
    if (error) toast.error("Chưa xoá được bình luận"); else toast.success("Đã xoá bình luận");
    await load();
  };

  const sectionOptions = [{ value: "", label: "Cả bài" }, ...sections.map((s, i) => ({ value: s.id, label: `Phần ${i + 1}: ${s.title}` }))];
  const chips = [
    { id: "all", label: "Tất cả", n: roots.length },
    ...(roots.some((c) => !c.section_id) ? [{ id: "lesson", label: "Cả bài", n: roots.filter((c) => !c.section_id).length }] : []),
    ...sections.map((s, i) => ({ id: s.id, label: `Phần ${i + 1}`, n: countBy(s.id) })).filter((c) => c.n > 0),
  ];
  const total = items?.length ?? 0;

  const actions = (c: Comment, child = false) => (
    <div className="cm-actions">
      {!child && (user
        ? <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Trả lời</button>
        : <button onClick={() => openAuth()}>Đăng nhập để trả lời</button>)}
      {user?.id === c.user_id && (confirm === c.id
        ? <span className="cm-confirm">Xoá bình luận này? <button className="danger" onClick={() => void remove(c.id)}>Xoá</button><button onClick={() => setConfirm(null)}>Giữ lại</button></span>
        : <button onClick={() => setConfirm(c.id)}>Xoá</button>)}
    </div>
  );

  const item = (c: Comment, child = false) => {
    const rs = replies[c.id] ?? [];
    return (
      <li key={c.id} className={`cm ${child ? "child" : ""}`}>
        <Avatar seed={c.user_id} size={child ? 30 : 40} title={c.author_name} />
        <div className="cm-main">
          <div className="cm-head">
            <b>{c.author_name}</b>
            {user?.id === c.user_id && <span className="cm-you">Bạn</span>}
            <time dateTime={c.created_at} title={exact(c.created_at)}>{ago(c.created_at)}</time>
            {!child && sectionTitle(c.section_id) && <a className="cm-tag" href={`#${c.section_id}`}>{sectionTitle(c.section_id)}</a>}
          </div>
          <p className="cm-body">{c.body}</p>
          {actions(c, child)}
          {!child && rs.length > 0 && (
            <button className="cm-toggle" aria-expanded={!!open[c.id]} onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}>
              <i aria-hidden>{open[c.id] ? "▾" : "▸"}</i>{open[c.id] ? "Ẩn phản hồi" : `Xem ${rs.length} phản hồi`}
            </button>
          )}
          {!child && open[c.id] && rs.length > 0 && <ul className="cm-replies">{rs.map((r) => item(r, true))}</ul>}
          {!child && replyTo === c.id && user && (
            <Composer autoFocus seed={user.id} placeholder={`Trả lời ${c.author_name}…`} submitLabel="Trả lời" onSend={send(c.id)} onCancel={() => setReplyTo(null)} />
          )}
        </div>
      </li>
    );
  };

  return (
    <section className="comments" id="hoi-dap">
      <header className="cm-top">
        <h2>Hỏi đáp và góp ý</h2>
        {items && <span className="cm-badge">{total}</span>}
      </header>

      {user ? (
        <Composer seed={user.id} placeholder={`Bạn thắc mắc gì, ${displayName(user)}? Hoặc chỗ nào cần sửa?`} submitLabel="Đăng" onSend={send(null)}
          extra={<Select label="Gắn với phần" value={section} options={sectionOptions} onChange={setSection} />} />
      ) : (
        <div className="cm-gate">
          <Avatar seed="guest" size={44} />
          <div><strong>Tham gia thảo luận</strong><p>Đăng nhập để đặt câu hỏi, góp ý hoặc trả lời bạn học khác.</p></div>
          <button className="btn primary" onClick={() => openAuth()}>Đăng nhập</button>
        </div>
      )}

      {roots.length > 1 && (
        <div className="cm-tools">
          <div className="cm-chips" role="tablist" aria-label="Lọc theo phần">
            {chips.map((c) => <button key={c.id} role="tab" aria-selected={filter === c.id} className={filter === c.id ? "on" : ""} onClick={() => setFilter(c.id)}>{c.label}<small>{c.n}</small></button>)}
          </div>
          <button className="cm-sort" onClick={() => setNewest((v) => !v)}>{newest ? "Mới nhất" : "Cũ nhất"} ⇅</button>
        </div>
      )}

      {items === null ? <Skeleton /> : shown.length === 0 ? (
        <div className="cm-empty">
          <Avatar seed="empty" size={72} />
          <strong>{roots.length === 0 ? "Chưa có câu hỏi nào" : "Chưa có bình luận ở mục này"}</strong>
          <p>{roots.length === 0 ? "Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ góp ý cho bài này." : "Thử chọn mục khác hoặc đăng bình luận mới."}</p>
        </div>
      ) : <ul className="cm-list">{shown.map((c) => item(c))}</ul>}
    </section>
  );
}
