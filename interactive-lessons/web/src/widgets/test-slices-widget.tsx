import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

/** Results of lab 7's tests, and what each slice loads (study note 11.07). */
const ITEMS: ChoiceItem[] = [
  { q: "@WebMvcTest không import SecurityConfig, GET /products/1 (luật của mình là public)", choices: ["200", "401"], a: "401", why: "Slice không nạp security của mình (bean securityConfig: false) nên dùng security mặc định." },
  { q: "@WebMvcTest + @Import(SecurityConfig.class), ROLE_USER gọi PUT /products/1", choices: ["200", "401", "403"], a: "403", why: "Có security của mình: ẩn danh GET 200, PUT không token 401, USER 403, ADMIN 200." },
  { q: "@DataJpaTest trên PostgreSQL, không có profile test", choices: ["Tự tạo bảng", "relation \"products_seq\" does not exist"], a: "relation \"products_seq\" does not exist", why: "Boot chỉ đặt ddl-auto=create-drop cho DB nhúng; PostgreSQL mặc định none. Sửa bằng @ActiveProfiles(\"test\") hoặc Flyway." },
  { q: "@DataJpaTest: decreaseStockAtomically lấy 2 khi stock 3", choices: ["1 dòng, stock 1, version 1", "0 dòng"], a: "1 dòng, stock 1, version 1", why: "Xin 5 khi còn 1 thì 0 dòng. Mỗi test tự rollback." },
  { q: "@SpringBootTest(RANDOM_PORT) + @ServiceConnection PostgreSQL", choices: ["Nạp slice web", "Nạp toàn bộ app, server thật"], a: "Nạp toàn bộ app, server thật", why: "Đây là test luồng JWT qua HTTP thật: bảng 401/403/201." },
  { q: "Profile test sau khi thêm Redis", choices: ["spring.cache.type: none", "Bắt buộc có Redis"], a: "spring.cache.type: none", why: "Để test cũ không vỡ; test cần Redis tự bật lại và import container." },
];

export function TestSlicesWidget() {
  return <ChoiceDrill items={ITEMS} summary={"Mỗi loại test trả lời được \"nạp gì, không nạp gì\" thì mới đoán đúng kết quả."} />;
}
