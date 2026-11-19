import { useState } from "react";

type Token = "none" | "user" | "admin" | "expired" | "forged";
type Path = "/api/me" | "/api/admin/stats";

/** The USER payload is the decoded token from the real run; the others change only the fields named in their label. */
const PAYLOAD: Record<Exclude<Token, "none">, object> = {
  user: { sub: "alice", exp: 1794572543, iat: 1794571043, roles: ["USER"] },
  admin: { sub: "admin", exp: 1794572543, iat: 1794571043, roles: ["ADMIN"] },
  expired: { sub: "alice", exp: 1794571583, iat: 1794570683, roles: ["USER"] },
  forged: { sub: "alice", exp: 1794572543, iat: 1794571043, roles: ["ADMIN"] },
};

const LABEL: Record<Token, string> = {
  none: "không gửi token",
  user: "token USER",
  admin: "token ADMIN",
  expired: "token hết hạn",
  forged: "sửa USER thành ADMIN, giữ chữ ký cũ",
};

/** Responses observed from a Spring Boot 3.5 resource server with HS256 tokens (study note 03.09). */
function respond(t: Token, p: Path): { status: number; header: string } {
  if (t === "none") return { status: 401, header: "WWW-Authenticate: Bearer" };
  if (t === "expired") return { status: 401, header: 'error="invalid_token", "Jwt expired at 2026-11-13T12:06:23Z"' };
  if (t === "forged") return { status: 401, header: 'error="invalid_token", "Signed JWT rejected: Invalid signature"' };
  if (p === "/api/admin/stats" && t === "user") return { status: 403, header: 'error="insufficient_scope"' };
  return { status: 200, header: p === "/api/me" ? "không có WWW-Authenticate" : '{"orders":42}' };
}

const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export function JwtLabWidget() {
  const [t, setT] = useState<Token>("user");
  const [p, setP] = useState<Path>("/api/admin/stats");
  const r = respond(t, p);
  const payload = t === "none" ? undefined : PAYLOAD[t];
  return (
    <div className="widget">
      <div className="seg small">
        {(Object.keys(LABEL) as Token[]).map((k) => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}>{LABEL[k]}</button>)}
      </div>
      <div className="seg small">
        {(["/api/me", "/api/admin/stats"] as Path[]).map((k) => <button key={k} className={p === k ? "on" : ""} onClick={() => setP(k)}>GET {k}</button>)}
      </div>
      {payload && (
        <pre className="code">{`${b64url({ alg: "HS256" })}.${b64url(payload)}.<chữ ký>\n\n// base64url decode, không cần key:\nheader  = {"alg":"HS256"}\npayload = ${JSON.stringify(payload)}`}</pre>
      )}
      <div className={`result ${r.status === 200 ? "good" : "bad"}`}>
        {r.status} {r.status === 401 ? "chưa xác thực" : r.status === 403 ? "không đủ quyền" : "OK"}
        <small>
          {r.header}
          <br />
          {t === "forged"
            ? "Payload đọc được nhưng không sửa được: chữ ký tính trên header.payload bằng secret, sửa một chữ là lệch."
            : t === "expired"
              ? "Hết hạn là 401, không phải 403, để client biết gọi refresh token."
              : r.status === 403
                ? "Token hợp lệ (đã biết là alice) nhưng hasRole(\"ADMIN\") cần authority ROLE_ADMIN."
                : "Encode không phải encrypt: ai có token đều đọc được payload. Đừng đặt dữ liệu nhạy cảm vào đây."}
        </small>
      </div>
    </div>
  );
}
