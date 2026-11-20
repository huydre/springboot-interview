import type { ReactNode } from "react";

const JAVA_KW = new Set(("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static super switch synchronized this throw throws try var void volatile while record sealed permits yield null true false").split(" "));
const SQL_KW = new Set(("select from where and or not in is null like between order by group having limit offset join inner left right full outer cross on as distinct union all intersect except case when then else end insert into values update set delete create table index drop alter add primary key foreign references unique default with over partition rows range exists any asc desc explain analyze begin commit rollback count sum avg min max coalesce cast true false").split(" "));

type Tok = { t: "kw" | "str" | "com" | "num" | "ann" | "type" | "fn" | "txt"; s: string };

/** Splits source into comments, strings, annotations, numbers, keywords, Types and calls. Good enough for the short snippets in lessons; not a parser. */
function tokenize(src: string, sql: boolean): Tok[] {
  const kw = sql ? SQL_KW : JAVA_KW;
  const re = sql
    ? /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^']|'')*')|(\b\d[\d_.]*\b)|([A-Za-z_]\w*)|(\s+|.)/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])')|(\b\d[\d_.]*[LlFfDd]?\b)|(@[A-Za-z_]\w*)|([A-Za-z_]\w*)|(\s+|.)/g;
  const out: Tok[] = [];
  const push = (t: Tok["t"], s: string) => { const l = out[out.length - 1]; if (l && l.t === t && t === "txt") l.s += s; else out.push({ t, s }); };
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) push("com", m[1]);
    else if (m[2]) push("str", m[2]);
    else if (m[3]) push("num", m[3]);
    else if (sql) {
      const w = m[4];
      if (w) push(kw.has(w.toLowerCase()) ? "kw" : "txt", w); else push("txt", m[5]);
    } else if (m[4]) push("ann", m[4]);
    else if (m[5]) {
      const w = m[5];
      const next = src[re.lastIndex];
      if (kw.has(w)) push("kw", w);
      else if (/^[A-Z]/.test(w)) push("type", w);
      else if (next === "(") push("fn", w);
      else push("txt", w);
    } else push("txt", m[6] ?? m[0]);
  }
  return out;
}

const SQL_START = /^\s*(--[^\n]*\n\s*)*(select|with|insert|update|delete|create|explain|begin|drop|alter)\b/i;

/** A `<pre className="code">` with light syntax colouring; plain nodes (not a string) render untouched. `lang` overrides the Java/SQL guess. */
export function Code({ children, lang }: { children: ReactNode; lang?: "java" | "sql" | "plain" }) {
  const src = Array.isArray(children) ? (children.every((c) => typeof c === "string") ? children.join("") : null) : typeof children === "string" ? children : null;
  if (src === null || lang === "plain") return <pre className="code">{children}</pre>;
  const sql = lang ? lang === "sql" : SQL_START.test(src);
  return (
    <pre className="code">
      {tokenize(src, sql).map((k, i) => (k.t === "txt" ? k.s : <span key={i} className={`tk-${k.t}`}>{k.s}</span>))}
    </pre>
  );
}
