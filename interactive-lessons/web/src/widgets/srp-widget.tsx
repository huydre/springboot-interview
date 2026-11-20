import { ChangeImpact } from "../components/change-impact";

/** SRP: one class with three owners vs one class per reason to change. Outputs of the Java were run on JDK 21. */
export function SrpWidget() {
  return (
    <ChangeImpact
      variants={[
        {
          label: "Một class làm hết",
          code: `class Invoice {
  long total(List<Long> lines) { /* tính tiền + thuế */ }
  String html(long total)      { /* dựng giao diện hoá đơn */ }
  void save(long total)        { /* INSERT vào database */ }
}`,
          scenarios: [
            { ask: "Kế toán đổi cách tính thuế", outcome: [{ text: "Sửa `Invoice.total()`, cùng file với `html()` và `save()`.", kind: "err" }, { text: "Phải build và test lại cả phần giao diện và lưu DB dù không đổi gì ở đó.", kind: "err" }] },
            { ask: "Marketing đổi mẫu hoá đơn", outcome: [{ text: "Sửa `Invoice.html()`, lại cùng file với phần tính tiền.", kind: "err" }, { text: "Lỡ tay gõ nhầm trong `total()` thì hoá đơn sai tiền.", kind: "err" }] },
            { ask: "DBA đổi cấu trúc bảng", outcome: [{ text: "Sửa `Invoice.save()`, lại là chính class này.", kind: "err" }] },
          ],
          verdict: "Ba người khác nhau (kế toán, marketing, DBA) cùng sửa một class: có 3 lý do để thay đổi.",
        },
        {
          label: "Mỗi lý do một class",
          code: `class InvoiceCalculator { long total(List<Long> lines) { ... } }   // kế toán
class InvoicePrinter    { String html(long total)      { ... } }   // marketing
class InvoiceRepository { void save(long total)        { ... } }   // DBA`,
          scenarios: [
            { ask: "Kế toán đổi cách tính thuế", outcome: [{ text: "Chỉ sửa `InvoiceCalculator`.", kind: "ok" }, { text: "`InvoicePrinter` và `InvoiceRepository` không bị đụng tới.", kind: "ok" }] },
            { ask: "Marketing đổi mẫu hoá đơn", outcome: [{ text: "Chỉ sửa `InvoicePrinter`.", kind: "ok" }] },
            { ask: "DBA đổi cấu trúc bảng", outcome: [{ text: "Chỉ sửa `InvoiceRepository`.", kind: "ok" }] },
          ],
          verdict: "Mỗi yêu cầu chỉ chạm đúng một class. Chạy thật: total = 350, html = <b>350</b>, INSERT invoice total=350.",
        },
      ]}
    />
  );
}
