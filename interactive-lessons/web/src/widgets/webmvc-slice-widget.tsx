import { useState } from "react";

/** @WebMvcTest(OrderController.class) without importing SecurityConfig, so Boot's default security applies (study note 03.12). */
function respond(user: boolean, csrf: boolean, valid: boolean): { status: number; note: string } {
  // CsrfFilter runs before AuthorizationFilter: a POST without a token is refused with 403 even for an anonymous caller.
  if (!csrf) return { status: 403, note: "CSRF bật trong cấu hình mặc định và CsrfFilter đứng trước AuthorizationFilter: POST thiếu token bị chặn 403 ngay cả khi chưa đăng nhập." };
  if (!user) return { status: 401, note: "Đã có CSRF token nhưng chưa đăng nhập: security mặc định của Boot vẫn bật trong slice, mọi request cần đăng nhập." };
  if (!valid) return { status: 400, note: "ProblemDetail \"Invalid request content.\", service không được gọi." };
  return { status: 201, note: "Location: /api/orders/100" };
}

export function WebmvcSliceWidget() {
  const [user, setUser] = useState(false);
  const [csrf, setCsrf] = useState(false);
  const [valid, setValid] = useState(true);
  const r = respond(user, csrf, valid);
  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button className={on ? "on" : ""} onClick={() => set(!on)}>{label}</button>
  );
  return (
    <div className="widget">
      <div className="seg small">
        {toggle(user, setUser, "@WithMockUser")}
        {toggle(csrf, setCsrf, ".with(csrf())")}
        {toggle(valid, setValid, "body hợp lệ")}
      </div>
      <pre className="code">{`mvc.perform(post("/api/orders")${csrf ? "\n    .with(csrf())" : ""}\n    .contentType(APPLICATION_JSON)\n    .content(${valid ? `"{\\"customer\\":\\"An\\",\\"quantity\\":2}"` : `"{\\"customer\\":\\"\\",\\"quantity\\":0}"`}))`}</pre>
      <div className={`result ${r.status < 300 ? "good" : "bad"}`}>
        {r.status}
        <small>{r.note} SecurityConfig của bạn không được nạp vào slice: muốn test rule thật thì @Import(SecurityConfig.class) và gửi .with(jwt()).</small>
      </div>
    </div>
  );
}
