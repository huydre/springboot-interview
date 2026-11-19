import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const CODES = ["400", "401", "403", "404", "409", "422", "429"] as const;

/** Pick the status for each situation. 401/403 rows match Spring Security resource-server responses (study note 03.08). */
const CASES: ChoiceItem[] = [
  { q: "Không gửi Bearer token", a: "401", why: "Chưa xác thực. Spring trả WWW-Authenticate: Bearer." },
  { q: "Token hết hạn", a: "401", why: "Vẫn là chưa xác thực: error=\"invalid_token\", \"Jwt expired at ...\". Trả 403 thì client không biết gọi refresh token." },
  { q: "Token USER gọi /api/admin/stats", a: "403", why: "Biết bạn là ai nhưng không đủ quyền: error=\"insufficient_scope\"." },
  { q: "Body JSON hỏng hoặc quantity = 0", a: "400", why: "Request sai định dạng hoặc validate fail." },
  { q: "Huỷ đơn đã giao", a: "422", why: "Đúng cú pháp nhưng nghiệp vụ không cho phép. Nhiều team dùng 422, một số dùng 409 (xung đột với trạng thái đơn); quan trọng là nhất quán trong cả API." },
  { q: "Đăng ký email đã tồn tại", a: "409", why: "Xung đột với trạng thái hiện tại." },
  { q: "Cập nhật sản phẩm bị OptimisticLockException", a: "409", why: "Version cũ vì người khác vừa sửa (412 nếu dùng If-Match)." },
  { q: "Gọi OTP quá nhiều lần", a: "429", why: "Vượt rate limit, kèm Retry-After để client biết chờ bao lâu." },
  { q: "Đơn 999 không tồn tại", a: "404", why: "Không có resource. Trả 404 thay 403 để giấu đơn của người khác cũng được, miễn là cố ý." },
];

export function StatusCodeWidget() {
  return (
    <ChoiceDrill
      items={CASES}
      choices={CODES}
      summary={'401 là "anh là ai?", 403 là "biết anh rồi, nhưng không được vào". Client thường chỉ retry 429, 503, 504 và lỗi mạng.'}
    />
  );
}
