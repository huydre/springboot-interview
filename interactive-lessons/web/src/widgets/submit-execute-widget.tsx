import { useState } from "react";

type Way = "submit-get" | "submit" | "execute";

/** A task that throws IllegalStateException, handed to a single-thread executor three ways. Output observed on JDK 21. */
const WAYS: Record<Way, { label: string; code: string; out: string; tone: "good" | "bad"; why: string }> = {
  "submit-get": {
    label: "submit() + get()",
    code: 'Future<?> f = ex.submit(() -> { throw new IllegalStateException("boom"); });\ntry { f.get(); } catch (ExecutionException e) { log(e.getCause()); }',
    out: "java.lang.IllegalStateException: boom",
    tone: "good",
    why: "lỗi được cất trong Future, get() bọc nó vào ExecutionException; getCause() lấy lỗi gốc",
  },
  submit: {
    label: "submit(), không get()",
    code: 'ex.submit(() -> { throw new IllegalStateException("silent"); });',
    out: "(không có dòng log nào)",
    tone: "bad",
    why: "lỗi nằm im trong Future không ai đọc: nguồn của bug job chạy nền không làm gì mà không có log",
  },
  execute: {
    label: "execute()",
    code: 'ex.execute(() -> { throw new IllegalStateException("loud"); });',
    out: 'Exception in thread "pool-1-thread-1" java.lang.IllegalStateException: loud',
    tone: "good",
    why: "lỗi bay lên thread, JVM in stack trace ra stderr",
  },
};

export function SubmitExecuteWidget() {
  const [way, setWay] = useState<Way>("submit");
  const w = WAYS[way];
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(WAYS) as Way[]).map((k) => <button key={k} className={way === k ? "on" : ""} onClick={() => setWay(k)}>{WAYS[k].label}</button>)}
      </div>
      <pre className="code">{w.code}</pre>
      <div className={`result ${w.tone === "bad" ? "warn" : "good"}`}>
        {w.out}
        <small>{w.why}. Với job chạy nền, hãy bắt lỗi và log ngay trong task.</small>
      </div>
    </div>
  );
}
