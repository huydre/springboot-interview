import { useState } from "react";
import { OrderDrill } from "../components/order-drill";

/** Step order of six core-mechanism diagrams (study note 06), rebuilt from memory. */
const DIAGRAMS: Record<string, { steps: string[]; done: string }> = {
  "@Transactional": {
    steps: [
      "Controller gọi proxy CGLIB",
      "TransactionInterceptor.invoke()",
      "TransactionManager lấy connection, setAutoCommit(false)",
      "Bind connection + EntityManager vào ThreadLocal",
      "Gọi method của target thật",
      "Commit, hoặc rollback nếu RuntimeException/Error",
      "Unbind, trả connection về pool",
    ],
    done: "Annotation chỉ là metadata, proxy mới làm việc. Transaction gắn vào ThreadLocal nên sang thread khác là mất. Checked exception mặc định vẫn commit.",
  },
  "Spring MVC": {
    steps: [
      "Tomcat worker thread nhận request",
      "Filter chain (Security, CORS, logging)",
      "DispatcherServlet.doDispatch()",
      "HandlerMapping tìm handler",
      "HandlerInterceptor.preHandle()",
      "HttpMessageConverter đọc body, @Valid",
      "Gọi @RestController",
      "Ghi response bằng HttpMessageConverter",
      "afterCompletion() rồi trả về qua Filter",
    ],
    done: "Filter thuộc Servlet API, đứng trước DispatcherServlet; Interceptor thuộc Spring MVC, bao quanh handler. Có exception thì @RestControllerAdvice trả ProblemDetail.",
  },
  "Vòng đời bean": {
    steps: [
      "Instantiate (constructor injection)",
      "Populate properties (setter, field injection)",
      "Aware callbacks",
      "postProcessBeforeInitialization (@PostConstruct)",
      "afterPropertiesSet(), initMethod",
      "postProcessAfterInitialization: tạo AOP proxy",
      "Bean sẵn sàng",
      "Context đóng: @PreDestroy, destroy()",
    ],
    done: "Proxy được tạo sau @PostConstruct, nên logic cần transaction lúc khởi động đặt ở ApplicationRunner hoặc ApplicationReadyEvent. Prototype không được gọi bước huỷ.",
  },
  ThreadPoolExecutor: {
    steps: [
      "Thread < corePoolSize: tạo thread core",
      "Không: queue còn chỗ thì xếp hàng",
      "Queue đầy: thread < max thì tạo thread non-core",
      "Đủ max: RejectedExecutionHandler",
    ],
    done: "Queue không giới hạn làm nhánh queue luôn đúng: không bao giờ reject, task dồn tới OOM. newFixedThreadPool có core = max nên vốn không có thread non-core; pool tự cấu hình core < max với queue như vậy cũng không bao giờ tạo thêm thread.",
  },
  "HashMap.put()": {
    steps: [
      "hash = h ^ (h >>> 16)",
      "index = (n - 1) & hash",
      "Bucket rỗng: tạo Node mới",
      "Có node cùng hash và equals: ghi đè value",
      "Không: thêm vào cuối list hoặc tree",
      "Bucket vượt 8 node và capacity ≥ 64: treeify",
      "++size > capacity × 0.75: resize gấp đôi",
    ],
    done: "Capacity mặc định 16, load factor 0.75, treeify khi thêm node thứ 9 và capacity ≥ 64 (chưa đủ 64 thì resize), untreeify khi ≤ 6.",
  },
  "Security + JWT": {
    steps: [
      "Request có header Authorization: Bearer",
      "FilterChainProxy chạy SecurityFilterChain",
      "BearerTokenAuthenticationFilter verify chữ ký và exp",
      "Set Authentication vào SecurityContextHolder",
      "AuthorizationFilter kiểm tra quyền",
      "Vào OrderController, trả 200",
    ],
    done: "Token sai hoặc hết hạn: 401 ở bước verify. Đủ xác thực nhưng thiếu quyền: 403 ở AuthorizationFilter.",
  },
};

export function DiagramRebuildWidget() {
  const [d, setD] = useState("@Transactional");
  return (
    <div className="widget">
      <div className="seg small">
        {Object.keys(DIAGRAMS).map((k) => <button key={k} className={d === k ? "on" : ""} onClick={() => setD(k)}>{k}</button>)}
      </div>
      <OrderDrill key={d} steps={DIAGRAMS[d].steps} done={DIAGRAMS[d].done} />
    </div>
  );
}
