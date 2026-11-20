import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/use-auth";
import { supabase } from "../lib/supabase";
import { AuthDialog } from "./auth-dialog";
import { Avatar } from "./ui/avatar";

type Comment = { id: string; user_id: string; author_name: string; body: string; parent_id: string | null; created_at: string; section_id: string | null };

const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
};

function Composer({ placeholder, onSend, autoFocus }: { placeholder: string; onSend: (body: string) => Promise<void>; autoFocus?: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form className="cm-form" onSubmit={async (e) => { e.preventDefault(); if (!body.trim()) return; setBusy(true); await onSend(body.trim()); setBody(""); setBusy(false); }}>
      <textarea className="text-input" rows={3} maxLength={2000} value={body} autoFocus={autoFocus} placeholder={placeholder} onChange={(e) => setBody(e.target.value)} />
      <button className="btn primary" disabled={busy || !body.trim()}>{busy ? "Đang gửi…" : "Gửi"}</button>
    </form>
  );
}

/** Public Q&A for a lesson: top-level comments with one level of replies; signed-in users can post and delete their own. */
export function Comments({ lessonSlug, sections }: { lessonSlug: string; sections: { id: string; title: string }[] }) {
  const { user, enabled } = useAuth();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [login, setLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase.from("comments").select("id, user_id, author_name, body, parent_id, created_at, section_id").eq("lesson_slug", lessonSlug).order("created_at", { ascending: true });
    if (e) { setError("Chưa tải được bình luận."); return; }
    setItems(data as Comment[]);
  }, [lessonSlug]);
  useEffect(() => { void load(); }, [load]);
  if (!enabled) return null;

  const send = (parent: string | null) => async (body: string) => {
    if (!supabase || !user) return;
    const { error: e } = await supabase.from("comments").insert({ lesson_slug: lessonSlug, section_id: parent ? null : section || null, body, parent_id: parent });
    if (e) { setError("Chưa gửi được, thử lại sau."); return; }
    setError(null); setReplyTo(null); await load();
  };
  const remove = async (id: string) => { await supabase?.from("comments").delete().eq("id", id); await load(); };

  const roots = (items ?? []).filter((c) => !c.parent_id);
  const repliesOf = (id: string) => (items ?? []).filter((c) => c.parent_id === id);
  const sectionTitle = (id: string | null) => sections.find((s) => s.id === id)?.title;

  const item = (c: Comment, child = false) => (
    <li key={c.id} className={`cm ${child ? "child" : ""}`}>
      <div className="cm-head">
        <Avatar seed={c.user_id} size={child ? 26 : 32} title={c.author_name} />
        <b>{c.author_name}</b>
        <small>{ago(c.created_at)}</small>
        {!child && sectionTitle(c.section_id) && <span className="cm-tag">{sectionTitle(c.section_id)}</span>}
      </div>
      <p>{c.body}</p>
      <div className="cm-actions">
        {!child && user && <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Trả lời</button>}
        {user?.id === c.user_id && <button onClick={() => void remove(c.id)}>Xoá</button>}
      </div>
      {replyTo === c.id && <Composer autoFocus placeholder="Viết câu trả lời…" onSend={send(c.id)} />}
      {!child && repliesOf(c.id).length > 0 && <ul className="cm-list">{repliesOf(c.id).map((r) => item(r, true))}</ul>}
    </li>
  );

  return (
    <section className="comments" id="hoi-dap">
      <h2>Hỏi đáp và góp ý</h2>
      {user ? (
        <>
          <label className="cm-section">Về phần
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Cả bài</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </label>
          <Composer placeholder="Bạn thắc mắc gì, hoặc thấy chỗ nào cần sửa?" onSend={send(null)} />
        </>
      ) : (
        <p className="muted"><button className="btn primary" onClick={() => setLogin(true)}>Đăng nhập</button> để đặt câu hỏi hoặc góp ý.</p>
      )}
      <AuthDialog open={login} onClose={() => setLogin(false)} />
      {error && <div className="result bad">{error}</div>}
      {items === null ? <p className="muted">Đang tải…</p> : roots.length === 0 ? <p className="muted">Chưa có bình luận nào. Hãy là người đầu tiên.</p> : <ul className="cm-list">{roots.map((c) => item(c))}</ul>}
    </section>
  );
}
