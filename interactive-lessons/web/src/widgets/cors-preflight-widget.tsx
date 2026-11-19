import { useState } from "react";

type Origin = "https://shop.example.com" | "https://evil.example" | "(không có Origin)";
type Req = "OPTIONS /api/me (preflight)" | "GET /api/public/ping";

/** Responses observed with CorsConfigurationSource allowing only shop.example.com on /api/** (study note 03.09). */
function respond(o: Origin, r: Req): { status: number; note: string } {
  if (o === "(không có Origin)")
    return { status: r.startsWith("OPTIONS") ? 401 : 200, note: "Không có Origin (curl, Postman, server-to-server) thì CORS không áp dụng: CORS bảo vệ người dùng trong browser, không phải cơ chế bảo mật cho API." };
  if (o === "https://evil.example") return { status: 403, note: "Spring chủ động trả 403 \"Invalid CORS request\" cho Origin không được phép." };
  return r.startsWith("OPTIONS")
    ? { status: 200, note: "Preflight hợp lệ trả 200 dù không có token: CorsFilter đứng trước BearerTokenAuthenticationFilter. Quên .cors() trong Security thì preflight bị chặn 401." }
    : { status: 200, note: "Access-Control-Allow-Origin: https://shop.example.com" };
}

export function CorsPreflightWidget() {
  const [o, setO] = useState<Origin>("https://shop.example.com");
  const [r, setR] = useState<Req>("OPTIONS /api/me (preflight)");
  const res = respond(o, r);
  return (
    <div className="widget">
      <div className="seg small">
        {(["https://shop.example.com", "https://evil.example", "(không có Origin)"] as Origin[]).map((x) => <button key={x} className={o === x ? "on" : ""} onClick={() => setO(x)}>{x}</button>)}
      </div>
      <div className="seg small">
        {(["OPTIONS /api/me (preflight)", "GET /api/public/ping"] as Req[]).map((x) => <button key={x} className={r === x ? "on" : ""} onClick={() => setR(x)}>{x}</button>)}
      </div>
      <div className={`result ${res.status === 200 ? "good" : "bad"}`}>
        {res.status}
        <small>{res.note}</small>
      </div>
      {o === "(không có Origin)" && r.startsWith("OPTIONS") && (
        <p className="muted">401 ở đây là suy ra: không có Origin thì OPTIONS chỉ là request thường không mang token tới endpoint cần đăng nhập.</p>
      )}
    </div>
  );
}
