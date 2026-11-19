import { useState } from "react";

type Opt<K extends string> = { id: K; label: string };
const TOKENS: Opt<"ok" | "none" | "expired">[] = [{ id: "ok", label: "JWT hợp lệ" }, { id: "none", label: "không có token" }, { id: "expired", label: "JWT hết hạn" }];
const PATHS: Opt<"orders" | "unknown">[] = [{ id: "orders", label: "GET /api/orders/42" }, { id: "unknown", label: "GET /api/reports" }];
const RATES: Opt<"under" | "over">[] = [{ id: "under", label: "trong hạn mức" }, { id: "over", label: "vượt hạn mức" }];
const DOWNS: Opt<"ok" | "slow" | "open">[] = [{ id: "ok", label: "order-service bình thường" }, { id: "slow", label: "chậm quá response-timeout" }, { id: "open", label: "circuit breaker OPEN" }];

type Hop = { at: string; ok: boolean; text: string };

/**
 * Spring Cloud Gateway (WebFlux). Spring Security runs as a WebFilter before route matching; RequestRateLimiter keys on the
 * user; the CircuitBreaker filter maps a timeout to 504 and CallNotPermittedException to 503 when no fallback is set.
 */
function walk(token: string, path: string, rate: string, down: string): { hops: Hop[]; status: number } {
  const hops: Hop[] = [];
  if (token !== "ok") {
    hops.push({ at: "Spring Security (WebFilter)", ok: false, text: token === "none" ? "không có Bearer token" : "chữ ký đúng nhưng exp đã qua" });
    return { hops, status: 401 };
  }
  hops.push({ at: "Spring Security (WebFilter)", ok: true, text: "kiểm chữ ký bằng JWKS đã cache, còn hạn" });
  if (path !== "orders") {
    hops.push({ at: "Route predicate", ok: false, text: "không route nào có Path khớp /api/reports/**" });
    return { hops, status: 404 };
  }
  hops.push({ at: "Route predicate", ok: true, text: "Path=/api/orders/** → lb://order-service" });
  if (rate === "over") {
    hops.push({ at: "RequestRateLimiter", ok: false, text: "token bucket của user này trên Redis đã hết" });
    return { hops, status: 429 };
  }
  hops.push({ at: "RequestRateLimiter", ok: true, text: "còn token, trừ 1" });
  hops.push({ at: "TokenRelay, traceparent", ok: true, text: "chuyển tiếp Authorization và header trace xuống service" });
  if (down === "slow") {
    hops.push({ at: "CircuitBreaker / timeout", ok: false, text: "quá thời gian chờ, không có fallbackUri" });
    return { hops, status: 504 };
  }
  if (down === "open") {
    hops.push({ at: "CircuitBreaker / timeout", ok: false, text: "mạch đang OPEN, không gọi xuống, không có fallbackUri" });
    return { hops, status: 503 };
  }
  hops.push({ at: "CircuitBreaker / timeout", ok: true, text: "mạch CLOSED, trả lời kịp" });
  hops.push({ at: "order-service", ok: true, text: "tự kiểm tra JWT lần nữa, kiểm tra đơn 42 thuộc user này" });
  return { hops, status: 200 };
}

function Seg<K extends string>({ opts, value, onPick }: { opts: Opt<K>[]; value: K; onPick: (k: K) => void }) {
  return (
    <div className="seg small">
      {opts.map((o) => <button key={o.id} className={value === o.id ? "on" : ""} onClick={() => onPick(o.id)}>{o.label}</button>)}
    </div>
  );
}

export function GatewayFiltersWidget() {
  const [token, setToken] = useState<"ok" | "none" | "expired">("ok");
  const [path, setPath] = useState<"orders" | "unknown">("orders");
  const [rate, setRate] = useState<"under" | "over">("under");
  const [down, setDown] = useState<"ok" | "slow" | "open">("ok");
  const { hops, status } = walk(token, path, rate, down);
  return (
    <div className="widget">
      <Seg opts={TOKENS} value={token} onPick={setToken} />
      <Seg opts={PATHS} value={path} onPick={setPath} />
      <Seg opts={RATES} value={rate} onPick={setRate} />
      <Seg opts={DOWNS} value={down} onPick={setDown} />
      <ol className="log">
        {hops.map((h) => <li key={h.at} className={h.ok ? "ok" : "err"}>{h.at}: {h.text}</li>)}
      </ol>
      <div className={`result ${status === 200 ? "good" : "bad"}`}>
        HTTP {status}
        <small>
          {status === 200
            ? "Gateway chỉ lo phần chung; quyền trên từng đơn hàng vẫn do order-service kiểm tra."
            : status === 401
              ? "Security chạy trước cả việc tìm route, nên path không tồn tại mà thiếu token vẫn là 401, không phải 404."
              : status === 404
                ? "Không có route nào khớp. Gateway không chuyển request tới service nào cả."
                : status === 429
                  ? "Trả kèm header X-RateLimit-*. Đếm trên Redis nên đúng cho mọi instance của gateway."
                  : status === 504
                    ? "Timeout ở gateway phải lớn hơn timeout của service phía sau, nếu không gateway bỏ cuộc trong khi service vẫn đang làm."
                    : "Mạch OPEN thì trả lỗi ngay, không giữ kết nối tới service đang hỏng. Có fallbackUri thì trả dữ liệu dự phòng thay vì 503."}
        </small>
      </div>
    </div>
  );
}
