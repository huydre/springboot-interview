import { useState } from "react";
import { Code } from "../components/code-block";

type Req = { label: string; http: string; status: number; body: string; stockAfter?: (s: number) => number; note: string };

/**
 * Requests against lab 4's order-service and the responses measured on PostgreSQL (profile dev) or in ApiErrorWebMvcTest
 * (study note 11.04). Keyboard (id 1) starts with stock 10; Monitor (id 2) with stock 1.
 */
const REQS: Req[] = [
  {
    label: "Đặt 2 Keyboard",
    http: "POST /orders\n{\"customerId\":1,\"items\":[{\"productId\":1,\"quantity\":2}]}",
    status: 201,
    body: "Location: /orders/1\n{ \"id\": 1, \"customerId\": 1, \"status\": \"CREATED\", \"total\": 200.00, ... }",
    stockAfter: (s) => s - 2,
    note: "Một transaction: tìm customer, mỗi item tìm product, trừ kho, lưu order. Không cần save(product): dirty checking lo.",
  },
  {
    label: "2 Keyboard + 5 Monitor",
    http: "POST /orders\n{\"customerId\":1,\"items\":[{\"productId\":1,\"quantity\":2},{\"productId\":2,\"quantity\":5}]}",
    status: 422,
    body: "{ \"title\": \"Business rule violated\", \"status\": 422,\n  \"detail\": \"Product 2 has only 1 in stock, requested 5\", \"code\": \"INSUFFICIENT_STOCK\" }",
    note: "Dòng Keyboard đã bị trừ trong bộ nhớ nhưng transaction rollback: kho Keyboard không đổi.",
  },
  {
    label: "Thiếu customerId, quantity 0",
    http: "POST /orders\n{\"customerId\":null,\"items\":[{\"productId\":1,\"quantity\":0}]}",
    status: 400,
    body: "{ \"title\": \"Bad Request\", \"status\": 400, \"detail\": \"Validation failed\", \"errors\": [ ... ] }",
    note: "Mảng errors dạng field: message, đo trong ApiErrorWebMvcTest.",
  },
  {
    label: "items rỗng",
    http: "POST /orders\n{\"customerId\":1,\"items\":[]}",
    status: 400,
    body: "{ \"detail\": \"Validation failed\", \"errors\": [\"items: must not be empty\"] }",
    note: "@NotEmpty trên items.",
  },
  {
    label: "Body {not json",
    http: "POST /orders\n{not json",
    status: 400,
    body: "{ \"detail\": \"Failed to read request\" }",
    note: "Do lớp cha ResponseEntityExceptionHandler xử lý HttpMessageNotReadableException.",
  },
  {
    label: "productId 51",
    http: "POST /orders\n{\"customerId\":1,\"items\":[{\"productId\":51,\"quantity\":1}]}",
    status: 404,
    body: "{ \"title\": \"Resource not found\", \"status\": 404, \"detail\": \"Product 51 not found\" }",
    note: "detail nói rõ cái gì, id nào.",
  },
  {
    label: "GET /orders/999",
    http: "GET /orders/999",
    status: 404,
    body: "{ \"title\": \"Resource not found\", \"status\": 404, \"detail\": \"Order 999 not found\", \"instance\": \"/orders/999\" }",
    note: "ProblemDetail, content type application/problem+json.",
  },
  {
    label: "GET /actuator/env",
    http: "GET /actuator/env",
    status: 404,
    body: "{ \"detail\": \"No static resource actuator/env.\" }",
    note: "Chỉ expose health và info. Endpoint không expose bị coi như đường dẫn tĩnh không tồn tại, và 404 cũng ra ProblemDetail nhờ advice kế thừa ResponseEntityExceptionHandler.",
  },
  {
    label: "GET /actuator/health",
    http: "GET /actuator/health",
    status: 200,
    body: "{ \"status\": \"UP\", \"groups\": [\"liveness\", \"readiness\"], \"components\": { \"db\": { \"status\": \"UP\", ... } } }",
    note: "Profile dev có show-details; profile test chỉ trả status và groups.",
  },
];

export function OrderApiWidget() {
  const [stock, setStock] = useState(10);
  const [last, setLast] = useState<Req | null>(null);
  const send = (r: Req) => {
    setLast(r);
    if (r.stockAfter && stock >= 2) setStock(r.stockAfter(stock));
  };
  return (
    <div className="widget">
      <div className="seg small">
        {REQS.map((r) => <button key={r.label} className={last === r ? "on" : ""} onClick={() => send(r)}>{r.label}</button>)}
        <button onClick={() => { setStock(10); setLast(null); }}>reset kho</button>
      </div>
      <p className="muted">Kho Keyboard hiện tại: {stock}{stock < 2 ? " (không đủ cho đơn 2 cái, bản thật sẽ trả 422)" : ""}</p>
      {last && (
        <>
          <Code>{last.http}</Code>
          <div className={`result ${last.status < 300 ? "good" : last.status === 422 ? "warn" : "bad"}`}>
            HTTP {last.status}
            <small>{last.note}</small>
          </div>
          <Code>{last.body}</Code>
        </>
      )}
    </div>
  );
}
