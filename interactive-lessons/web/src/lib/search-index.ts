import { courses, lessons } from "../data/course";
import { sdProblems } from "../data/sd-problems";
import { contentWords } from "./answer-match";

export type Hit = { kind: string; title: string; sub: string; href: string; title_: string; hay: string };

const fold = (s: string) => contentWords(s).join(" ");
const strip = (s: string) => s.replace(/[*`]/g, "").replace(/\{\{[^|}]+\|?([^}]*)\}\}/g, "$1");

/** Everything searchable across the site: lessons, sections and parts, flashcard questions, practice modes and design problems. */
function build(): Hit[] {
  const out: Hit[] = [];
  const add = (kind: string, title: string, sub: string, href: string, extra = "") => {
    const t = strip(title);
    out.push({ kind, title: t, sub: strip(sub), href, title_: fold(t), hay: fold(`${t} ${sub} ${extra}`) });
  };
  for (const c of courses) {
    for (const { slug, title } of c.lessons) {
      const l = lessons[slug];
      if (!l) continue;
      add("Bài học", title, `${c.title} · ${l.subtitle}`, `?bai=${slug}`);
      for (const s of l.sections) {
        add("Phần", s.title, title, `?bai=${slug}#${s.id}`, s.intro.slice(0, 2).join(" "));
        for (const p of s.parts ?? []) add("Phần", p.title, `${title} · ${s.title}`, `?bai=${slug}#${p.id}`, p.intro.slice(0, 2).join(" "));
      }
      for (const card of l.cards ?? []) add("Câu hỏi", card.q, title, `?luyen=cau-hoi&q=${encodeURIComponent(strip(card.q).slice(0, 40))}`, card.a);
    }
  }
  add("Luyện tập", "Ôn tập mỗi ngày", "10 câu theo lịch giãn cách", "?luyen=on-tap", "spaced repetition review streak");
  add("Luyện tập", "Mock interview bấm giờ", "5 câu ngẫu nhiên theo chặng", "?luyen=mock", "phong van thu");
  add("Luyện tập", "Câu hỏi hay gặp", "Ngân hàng câu hỏi theo chặng", "?luyen=cau-hoi", "faq");
  add("Luyện tập", "System design từng bước", "5 đề kinh điển", "?luyen=sd");
  for (const p of sdProblems) add("Đề system design", p.title, p.brief, `?luyen=sd&de=${p.id}`);
  return out;
}

let index: Hit[] | null = null;

/** Hits whose text contains every query word; title matches rank first, then lessons before sections before questions. */
export function search(query: string, limit = 30): Hit[] {
  index ??= build();
  const words = fold(query).split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const rank = { "Bài học": 0, "Luyện tập": 1, "Đề system design": 1, "Phần": 2, "Câu hỏi": 3 } as Record<string, number>;
  return index
    .filter((h) => words.every((w) => h.hay.includes(w)))
    .map((h) => ({ h, s: words.filter((w) => h.title_.includes(w)).length * 10 - (rank[h.kind] ?? 4) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.h);
}
