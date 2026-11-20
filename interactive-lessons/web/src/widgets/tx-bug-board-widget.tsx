import { useState } from "react";
import { Code } from "../components/code-block";

type Run = { facts: [string, string][]; log: string[]; ok: boolean };
type Bug = { title: string; call: string; buggy: Run; fixed: Run; fix: string };

/** The five transaction bugs of lab 5, buggy and fixed, measured on PostgreSQL Testcontainers (study note 11.05). Keyboard stock starts at 10. */
const BUGS: Bug[] = [
  {
    title: "1 · Self-invocation",
    call: "placeOrderBuggy(orderFailingOnSecondLine())  // this.reserveStock(req)",
    fix: "Gọi qua bean khác (OrderService.placeOrder) để đi qua proxy.",
    buggy: { ok: false, facts: [["txActive trong reserveStock", "false"], ["Exception", "InsufficientStockException"], ["Kho Keyboard", "8 (ghi dở)"]], log: ["reserveStock txActive=false", "Creating new transaction with name [...SimpleJpaRepository.findById]", "Creating new transaction with name [...SimpleJpaRepository.save]", "Committing JPA transaction on EntityManager [...]"] },
    fixed: { ok: true, facts: [["txActive", "true"], ["Exception", "InsufficientStockException"], ["Kho Keyboard", "10"], ["Số đơn", "0"]], log: ["Không còn transaction riêng cho từng lời gọi repository: cả đơn rollback cùng nhau."] },
  },
  {
    title: "2 · Checked exception",
    call: "checkoutBuggy(validOrder())  // charge() ném PaymentFailedException extends Exception",
    fix: "@Transactional(rollbackFor = PaymentFailedException.class).",
    buggy: { ok: false, facts: [["Exception", "PaymentFailedException: Card declined for order 1, amount 200.00"], ["Số đơn", "1"], ["Kho Keyboard", "8"], ["Email", "Order #1 confirmed: có gửi"]], log: ["Initiating transaction commit", "Committing JPA transaction on EntityManager [...]", "EMAIL to=an@example.com subject=\"Order #1 confirmed\""] },
    fixed: { ok: true, facts: [["Exception", "PaymentFailedException"], ["Số đơn", "0"], ["Kho Keyboard", "10"], ["Email", "không"]], log: ["Rollback, nên listener AFTER_COMMIT không chạy."] },
  },
  {
    title: "3 · Audit log",
    call: "placeWithAudit...(orderFailingOnSecondLine())",
    fix: "AuditService.record với propagation = REQUIRES_NEW ở bean khác.",
    buggy: { ok: false, facts: [["Dòng audit ORDER_ATTEMPT", "0"], ["Số đơn", "0"], ["Kho Keyboard", "10"]], log: ["auditLogs.save() cùng transaction nên rollback theo đơn hàng."] },
    fixed: { ok: true, facts: [["Dòng audit ORDER_ATTEMPT", "1"], ["Số đơn", "0"], ["Kho Keyboard", "10"]], log: ["Suspending current transaction, creating new transaction with name [...AuditService.record]", "Committing JPA transaction on EntityManager [...]", "Resuming suspended transaction after completion of inner transaction", "Participating transaction failed - marking existing transaction as rollback-only", "Initiating transaction rollback"] },
  },
  {
    title: "4 · UnexpectedRollback",
    call: "placeWithLoyalty...(validOrder())  // try { addPoints } catch { log.warn }",
    fix: "addPoints chạy REQUIRES_NEW: lỗi của nó không đánh dấu transaction đặt hàng.",
    buggy: { ok: false, facts: [["Exception", "UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only"], ["Số đơn", "0"], ["Kho Keyboard", "10"]], log: ["Participating transaction failed - marking existing transaction as rollback-only", "Loyalty points skipped: Loyalty service unavailable", "Initiating transaction commit"] },
    fixed: { ok: true, facts: [["Exception", "không"], ["Số đơn", "1"], ["Kho Keyboard", "8"]], log: ["Loyalty lỗi rollback riêng, đơn hàng commit."] },
  },
  {
    title: "5 · Email sau commit",
    call: "checkoutWithTimeout(req)  // đặt hàng xong ném IllegalStateException",
    fix: "@TransactionalEventListener(AFTER_COMMIT); ghi DB trong listener bằng REQUIRES_NEW.",
    buggy: { ok: false, facts: [["Số đơn", "0"], ["Email @EventListener", "[EAGER] Order #6 confirmed: gửi cho đơn không tồn tại"], ["NotificationLog ghi bằng save() REQUIRED trong AFTER_COMMIT", "0 dòng, không cảnh báo"]], log: ["AFTER_COMMIT txActive=true txName=...OrderService.placeOrder", "Found thread-bound EntityManager [SessionImpl(1650792202<open>)]", "Participating in existing transaction"] },
    fixed: { ok: true, facts: [["Số đơn", "0"], ["Email AFTER_COMMIT", "[] (không gửi)"], ["NotificationLog bằng REQUIRES_NEW", "1 dòng (sau một đơn thành công)"]], log: ["Suspending current transaction, creating new transaction with name [...record]", "Opened new EntityManager [SessionImpl(1611262123<open>)]"] },
  },
];

export function TxBugBoardWidget() {
  const [i, setI] = useState(0);
  const [fixed, setFixed] = useState(false);
  const b = BUGS[i];
  const r = fixed ? b.fixed : b.buggy;
  return (
    <div className="widget">
      <div className="seg small">
        {BUGS.map((x, n) => <button key={x.title} className={i === n ? "on" : ""} onClick={() => { setI(n); setFixed(false); }}>{x.title}</button>)}
      </div>
      <div className="seg small">
        <button className={!fixed ? "on" : ""} onClick={() => setFixed(false)}>bản lỗi</button>
        <button className={fixed ? "on" : ""} onClick={() => setFixed(true)}>bản sửa</button>
      </div>
      <Code>{b.call}</Code>
      <ul className="log">{r.facts.map(([k, v]) => <li key={k} className={r.ok ? "ok" : "err"}>{k}: {v}</li>)}</ul>
      <ul className="log">{r.log.map((l) => <li key={l}>{l}</li>)}</ul>
      <p className="muted">Cách sửa: {b.fix}</p>
    </div>
  );
}
