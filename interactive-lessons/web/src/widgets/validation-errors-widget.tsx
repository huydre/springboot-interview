import { useState } from "react";

/** Where validation fails, which exception Spring throws and what the client gets, Boot 3.5 + Hibernate Validator 8 (study note 04.05). The groups row without advice follows from the @RequestBody row; the rest were run. */
const CASES: { label: string; ex: string; withAdvice: string; without: string; bad?: boolean }[] = [
  {
    label: "@Valid @RequestBody",
    ex: "MethodArgumentNotValidException",
    withAdvice: '400 {"detail":"Validation failed","errors":["customer: must not be blank","phone: số điện thoại không hợp lệ","quantity: must be greater than or equal to 1"]}',
    without: '400 {"status":400,"error":"Bad Request","path":"/orders"}: không nói field nào sai (problemdetails bật thì "Invalid request content.")',
  },
  {
    label: "@RequestParam @Min(0) int page",
    ex: "HandlerMethodValidationException",
    withAdvice: '400 "detail":"Validation failure"',
    without: '400 "detail":"Validation failure" (không cần @Validated trên class từ Spring 6.1)',
  },
  {
    label: "service @Validated find(@NotBlank email)",
    ex: "ConstraintViolationException: find.email: must not be blank",
    withAdvice: "400 nếu có @ExceptionHandler(ConstraintViolationException.class)",
    without: "500: không phải exception web nên Spring không tự trả 400",
    bad: true,
  },
  {
    label: "groups {OnUpdate, Default}",
    ex: "MethodArgumentNotValidException",
    withAdvice: 'PUT /orders/5 body {"customer":"An"} → 400 errors ["id: must not be null"]',
    without: "400 không có danh sách field. Chỉ ghi OnUpdate mà quên Default.class thì @NotBlank customer không được kiểm tra.",
  },
  {
    label: "exception nghiệp vụ tự định nghĩa",
    ex: "OrderNotFoundException",
    withAdvice: '404 application/problem+json {"title":"Order not found","detail":"Order 0 not found","instance":"/orders/0"}',
    without: '500 {"status":500,"error":"Internal Server Error"}',
    bad: true,
  },
];

export function ValidationErrorsWidget() {
  const [i, setI] = useState(0);
  const [advice, setAdvice] = useState(false);
  const c = CASES[i];
  const out = advice ? c.withAdvice : c.without;
  const bad = !advice && (c.bad || i === 0);
  return (
    <div className="widget">
      <div className="seg small">
        {CASES.map((x, n) => <button key={x.label} className={i === n ? "on" : ""} onClick={() => setI(n)}>{x.label}</button>)}
      </div>
      <div className="seg small">
        <button className={!advice ? "on" : ""} onClick={() => setAdvice(false)}>không có @RestControllerAdvice</button>
        <button className={advice ? "on" : ""} onClick={() => setAdvice(true)}>có advice</button>
      </div>
      <div className={`result ${bad ? "bad" : "good"}`}>
        {c.ex}
        <small>{out}</small>
      </div>
    </div>
  );
}
