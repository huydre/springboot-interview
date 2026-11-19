import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const CHOICES = ["Chạy đúng", "Đúng nhưng nguy hiểm", "Ném exception"] as const;

/** Fetch-join cases measured on Hibernate 6.6 + PostgreSQL 16 (study note 05.07). */
const ITEMS: ChoiceItem[] = [
  { q: "join fetch o.items + Pageable (trang 3 order)", a: "Đúng nhưng nguy hiểm", why: "WARN HHH90003004: applying in memory. SQL không có LIMIT: 1 triệu order kéo hết lên RAM. Sửa: phân trang id trước rồi fetch theo id (3 query)." },
  { q: "join fetch o.customer + Pageable", a: "Chạy đúng", why: "To-one không nhân số dòng: không WARN, SQL kết thúc bằng fetch first ? rows only." },
  { q: "join fetch o.items join fetch o.payments (cả hai là List)", a: "Ném exception", why: "MultipleBagFetchException: cannot simultaneously fetch multiple bags: [demo.Order.items, demo.Order.payments]." },
  { q: "Như trên nhưng đổi cả hai sang Set", a: "Đúng nhưng nguy hiểm", why: "Hết exception nhưng tích Descartes vẫn còn: 50 item × 20 payment = 1000 dòng cho một order. Fetch từng collection bằng query riêng." },
  { q: "Pageable + fail_on_pagination_over_collection_fetch=true", a: "Ném exception", why: "JpaSystemException: setFirstResult() or setMaxResults() specified with collection fetch join. Nên bật ở test để phát hiện sớm." },
  { q: "orderRepo.getReferenceById(id) rồi item.setOrder(...)", a: "Chạy đúng", why: "Proxy chưa query: đo được 0 SELECT khi chỉ cần gán khoá ngoại." },
  { q: "invoiceRepo.findAll() với @ManyToOne không ghi fetch", a: "Đúng nhưng nguy hiểm", why: "Mặc định EAGER: 11 query cho 10 invoice, và không tắt được ở mức query. Đặt mọi association LAZY." },
];

export function FetchTrapWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={CHOICES}
      summary="Dự án: default_batch_fetch_size 50–100 làm lưới an toàn, @EntityGraph hoặc JOIN FETCH cho màn chi tiết, DTO projection cho API danh sách."
    />
  );
}
