import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const CODES = ["400", "405", "406", "415"] as const;

/** Spring MVC rejections before the controller runs; the two ?page rows were measured with problemdetails enabled (study note 04.04). */
const ITEMS: ChoiceItem[] = [
  { q: "POST JSON nhưng thiếu header Content-Type: application/json", a: "415", why: "Unsupported Media Type: không có HttpMessageConverter đọc được kiểu body đó." },
  { q: "Client gửi Accept: application/xml, server chỉ ghi JSON", a: "406", why: "Not Acceptable: không có converter ghi được kiểu client chấp nhận." },
  { q: "DELETE /orders/7 trong khi chỉ có @GetMapping", a: "405", why: "Đúng URL, sai HTTP method." },
  { q: "GET /orders?page=abc", a: "400", why: "Đã đo: detail \"Failed to convert 'page' with value: 'abc'\"." },
  { q: "GET /orders?page=-1 với @Min(0) trên @RequestParam", a: "400", why: "Đã đo: \"Validation failure\". Có hiệu lực mà không cần @Validated trên class nhờ method validation từ Spring 6.1." },
  { q: "JSON sai cú pháp", a: "400", why: "HttpMessageNotReadableException." },
];

export function MvcStatusWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={CODES}
      summary="Đọc body theo Content-Type của request, ghi body theo Accept của client. Field JSON sai tên thì Jackson bỏ qua im lặng và để null: kết hợp @NotNull để bắt."
    />
  );
}
