import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const KINDS = ["Unit", "@WebMvcTest", "@DataJpaTest", "@SpringBootTest"] as const;

/** Where each check belongs in the test pyramid; timings are the per-class runs in study note 03.12. */
const ITEMS: ChoiceItem[] = [
  { q: "Tính giảm giá theo hạng thành viên, nhiều nhánh if/else", a: "Unit", why: "Logic thuần, mock repository ở ranh giới. Class unit 4 test chạy khoảng 1 s." },
  { q: "POST /api/orders body sai trả 400 dạng ProblemDetail", a: "@WebMvcTest", why: "Chỉ cần tầng web: controller, advice, validation, Jackson. Khoảng 0,8 s." },
  { q: "Native query ON CONFLICT (sku) DO NOTHING", a: "@DataJpaTest", why: "Phải chạy trên PostgreSQL thật (Testcontainers): H2 báo lỗi cú pháp. Khoảng 19 s kể cả khởi động container." },
  { q: "Đặt hàng xong thì product::1 bị evict khỏi Redis", a: "@SpringBootTest", why: "Xuyên tầng: service, proxy cache, Redis thật. Khoảng 23 s." },
  { q: "URL /api/admin/** chỉ cho ADMIN", a: "@WebMvcTest", why: "Nhớ @Import(SecurityConfig.class): slice không tự nạp cấu hình security của bạn." },
  { q: "Consumer nhận lại message khi chưa commit offset", a: "@SpringBootTest", why: "Cần Kafka thật trong container. Khoảng 72 s (có 20 s chờ cố ý)." },
];

export function TestPyramidWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={KINDS}
      summary="Nhiều unit test ở đáy, ít test nặng ở đỉnh: chênh lệch thời gian giữa hai đầu là hàng chục lần."
    />
  );
}
