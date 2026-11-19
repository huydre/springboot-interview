import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const GROUPS = ["Không qua proxy", "Interceptor commit", "Thread khác"] as const;

/** The three groups every "@Transactional does nothing" case falls into (study note 05.02). */
const ITEMS: ChoiceItem[] = [
  { q: "importOrders() gọi this.importOne() có @Transactional", a: "Không qua proxy", why: "Self-invocation: mỗi dòng không có transaction riêng. Tách importOne sang bean OrderImporter." },
  { q: "throw new InsufficientBalanceException() (extends Exception)", a: "Interceptor commit", why: "Checked exception mặc định commit. Cho business exception extends RuntimeException, hoặc rollbackFor = Exception.class." },
  { q: "@Async sendConfirmation(orderId) gọi findById ra rỗng", a: "Thread khác", why: "task-1 không có transaction và không thấy dữ liệu chưa commit. Dùng @TransactionalEventListener(AFTER_COMMIT)." },
  { q: "catch (Exception e) { log.error(...); }", a: "Interceptor commit", why: "Exception bị nuốt: ném lại hoặc bọc vào exception nghiệp vụ." },
  { q: "Kotlin service không có plugin kotlin-spring", a: "Không qua proxy", why: "Class Kotlin mặc định final nên CGLIB không tạo được subclass: app lỗi ngay lúc khởi động (Cannot subclass final class). Mở class mà quên mở method thì method final chạy trên proxy, không có transaction và field bị null. Thêm plugin kotlin-spring." },
  { q: "@PostConstruct gọi method @Transactional của chính bean", a: "Không qua proxy", why: "Gọi qua this, và proxy được tạo sau bước init. Chuyển sang ApplicationReadyEvent." },
  { q: "CompletableFuture.supplyAsync(() -> repo.save(x)) trong @Transactional", a: "Thread khác", why: "ThreadLocal không theo sang thread của ForkJoinPool." },
];

export function TxGroupWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={GROUPS}
      summary="Debug: bật DEBUG cho JpaTransactionManager tìm dòng Creating new transaction, in isActualTransactionActive(), in getClass() xem có $$SpringCGLIB$$, xem exception có ra khỏi method và là checked hay unchecked."
    />
  );
}
