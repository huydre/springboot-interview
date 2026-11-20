import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/use-auth";
import { supabase } from "../lib/supabase";

/** Private note for one section, saved to the account a moment after the learner stops typing. */
export function SectionNote({ lessonSlug, sectionId }: { lessonSlug: string; sectionId: string }) {
  const { user, enabled } = useAuth();
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const loaded = useRef(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from("notes").select("body").eq("user_id", user.id).eq("lesson_slug", lessonSlug).eq("section_id", sectionId).maybeSingle()
      .then(({ data }) => { setBody((data?.body as string | undefined) ?? ""); loaded.current = true; });
  }, [user, lessonSlug, sectionId]);

  if (!enabled || !user) return null;

  const change = (v: string) => {
    setBody(v); setState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const q = v.trim()
        ? supabase!.from("notes").upsert({ user_id: user.id, lesson_slug: lessonSlug, section_id: sectionId, body: v, updated_at: new Date().toISOString() })
        : supabase!.from("notes").delete().eq("user_id", user.id).eq("lesson_slug", lessonSlug).eq("section_id", sectionId);
      const { error } = await q;
      setState(error ? "error" : "saved");
    }, 800);
  };

  return (
    <details className="note-box" open={body.length > 0}>
      <summary>Ghi chú của bạn{body ? " ✎" : ""}</summary>
      <textarea className="text-input" rows={4} maxLength={10000} value={body} placeholder="Điều bạn muốn nhớ về phần này, chỉ mình bạn thấy." onChange={(e) => change(e.target.value)} />
      <small className="muted">{state === "saving" ? "Đang lưu…" : state === "saved" ? "Đã lưu" : state === "error" ? "Chưa lưu được" : "Tự động lưu"}</small>
    </details>
  );
}
