import { useState } from "react";

type Who = "none" | "tampered" | "user" | "admin";
type Call = "GET /orders" | "POST /orders" | "POST /products" | "GET /products/1";

/** Real statuses and WWW-Authenticate headers from lab 7's integration test over HTTP (study note 11.07). */
function outcome(who: Who, call: Call): { status: number; header: string } {
  if (call === "GET /products/1") return { status: 200, header: "Luật GET /products/** permitAll: ai cũng gọi được" };
  if (who === "none") return { status: 401, header: "WWW-Authenticate: Bearer" };
  if (who === "tampered") return { status: 401, header: "WWW-Authenticate: Bearer error=\"invalid_token\", ... Signed JWT rejected: Invalid signature" };
  if (call === "POST /products" && who === "user") return { status: 403, header: "WWW-Authenticate: Bearer error=\"insufficient_scope\", error_description=\"The request requires higher privileges than provided by the access token.\"" };
  if (call === "GET /orders") return { status: 200, header: "Suy ra từ luật /orders/**: token hợp lệ bất kỳ (lab không ghi riêng ô này)" };
  if (call === "POST /orders" && who === "admin") return { status: 201, header: "Suy ra từ luật: token hợp lệ bất kỳ (đo được với USER)" };
  return { status: 201, header: "Đo được trong integration test" };
}

const WHO: [Who, string][] = [["none", "không token"], ["tampered", "token sửa 2 ký tự cuối"], ["user", "user (USER)"], ["admin", "admin (ADMIN, USER)"]];
const CALLS: Call[] = ["GET /orders", "POST /orders", "POST /products", "GET /products/1"];

export function AuthMatrixWidget() {
  const [who, setWho] = useState<Who>("user");
  const [call, setCall] = useState<Call>("POST /products");
  const o = outcome(who, call);
  return (
    <div className="widget">
      <div className="seg small">{WHO.map(([k, l]) => <button key={k} className={who === k ? "on" : ""} onClick={() => setWho(k)}>{l}</button>)}</div>
      <div className="seg small">{CALLS.map((c) => <button key={c} className={call === c ? "on" : ""} onClick={() => setCall(c)}>{c}</button>)}</div>
      <div className={`result ${o.status < 300 ? "good" : "bad"}`}>
        HTTP {o.status}
        <small>{o.header}</small>
      </div>
      <p className="muted">
        401: không biết bạn là ai (thiếu token, sai chữ ký, hết hạn). 403: biết bạn là ai nhưng không đủ quyền. Login sai mật khẩu: 401 ProblemDetail
        "Invalid username or password", không phải 500. Payload {`{"iss":"order-service","sub":"user","exp":...}`} chỉ được ký, không mã hoá: ai cầm token cũng đọc được.
      </p>
    </div>
  );
}
