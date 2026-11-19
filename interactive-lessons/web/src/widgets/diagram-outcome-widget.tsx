import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Walk one situation through a core-mechanism diagram and pick where it ends (study note 06). */
const ITEMS: ChoiceItem[] = [
  { q: "@Transactional method ném IOException, không có rollbackFor", choices: ["Commit", "Rollback"], a: "Commit", why: "Nhánh checked exception của TransactionInterceptor: commit, là bẫy." },
  { q: "outer() nuốt RuntimeException của inner() REQUIRED ở bean khác", choices: ["Commit", "UnexpectedRollbackException"], a: "UnexpectedRollbackException", why: "Exception qua proxy của inner đã đánh dấu rollback-only." },
  { q: "Pool core 2, max 4, queue 10 đang đầy, 2 thread đang chạy, submit thêm", choices: ["Xếp hàng", "Tạo thread non-core", "Reject"], a: "Tạo thread non-core", why: "Queue đầy và thread < max." },
  { q: "newFixedThreadPool(4), task dồn rất nhiều", choices: ["Tạo thêm thread", "Xếp hàng mãi", "Reject"], a: "Xếp hàng mãi", why: "core = max = 4 và LinkedBlockingQueue không giới hạn: không tạo thêm thread, không bao giờ reject, task dồn tới OOM." },
  { q: "HashMap capacity 16, một bucket vừa thêm node thứ 9", choices: ["Treeify", "Resize"], a: "Resize", why: "Treeify cần capacity ≥ 64; chưa đủ thì resize." },
  { q: "Token JWT hết hạn", choices: ["401", "403"], a: "401", why: "Bị chặn ở bước verify, chưa tới kiểm tra quyền." },
  { q: "Token hợp lệ, role USER gọi API chỉ dành cho ADMIN", choices: ["401", "403"], a: "403", why: "Đã xác thực, AuthorizationFilter từ chối." },
  { q: "Bạn tự khai báo bean DataSource", choices: ["Auto-config tạo thêm", "Auto-config bỏ qua"], a: "Auto-config bỏ qua", why: "@ConditionalOnMissingBean: bean của bạn được ComponentScan xử lý trước." },
  { q: "@PostConstruct gọi method @Transactional của chính bean", choices: ["Có transaction", "Không có transaction"], a: "Không có transaction", why: "Proxy tạo ở postProcessAfterInitialization, sau @PostConstruct, và lời gọi đi qua this." },
  { q: "Đọc product:42, Redis trả null", choices: ["Trả null", "SELECT DB rồi SET kèm TTL"], a: "SELECT DB rồi SET kèm TTL", why: "Cache miss của cache-aside. Ghi thì UPDATE DB rồi DEL key." },
];

export function DiagramOutcomeWidget() {
  return <ChoiceDrill items={ITEMS} summary="Mỗi câu là một nhánh rẽ trong sơ đồ. Sai câu nào thì vẽ lại sơ đồ đó ra giấy và nói to từng mũi tên." />;
}
