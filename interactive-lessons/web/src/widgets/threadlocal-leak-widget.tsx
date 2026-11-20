import { useState } from "react";
import { Code } from "../components/code-block";

/** ThreadLocal on a single-thread pool (like a reused Tomcat thread). Every output was run on JDK 21. */
export function ThreadLocalLeakWidget() {
  const [remove, setRemove] = useState(false);
  return (
    <div className="widget">
      <div className="seg small">
        <button className={!remove ? "on" : ""} onClick={() => setRemove(false)}>quên remove()</button>
        <button className={remove ? "on" : ""} onClick={() => setRemove(true)}>remove() trong finally</button>
      </div>
      <Code>{remove
        ? `pool.submit(() -> {
    CURRENT_USER.set("bob");
    try { /* xử lý request 1 */ } finally { CURRENT_USER.remove(); }
});
pool.submit(() -> CURRENT_USER.get());   // request 2, cùng thread`
        : `pool.submit(() -> CURRENT_USER.set("alice"));   // request 1 quên remove
pool.submit(() -> CURRENT_USER.get());           // request 2, cùng thread`}</Code>
      <div className={`result ${remove ? "good" : "bad"}`}>
        request 2 đọc được: {remove ? "null" : "\"alice\""}
        <small>{remove
          ? "Thread được trả lại sạch cho request sau. Quy tắc: set thì phải remove() trong finally."
          : "Pool tái sử dụng thread nên request sau thấy user của request trước: sai dữ liệu, lỗi bảo mật, và value không bao giờ được GC."}</small>
      </div>
      <p className="muted">Còn một bẫy nữa: CURRENT_USER.set("carol") trên main rồi CompletableFuture.supplyAsync(() -&gt; CURRENT_USER.get()) đọc được null. ThreadLocal không tự sang thread khác; với @Async dùng TaskDecorator để copy MDC và SecurityContext.</p>
    </div>
  );
}
