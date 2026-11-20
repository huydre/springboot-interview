import { ChoiceDrill } from "../components/choice-drill";
import type { ChoiceItem } from "../components/choice-drill";

const CHOICES = ["Vi phạm 1NF", "Vi phạm 2NF", "Vi phạm 3NF", "Đạt cả ba"] as const;

const ITEMS: ChoiceItem[] = [
  { q: "Bảng `customer` có cột `phones` lưu \"0901000001, 0902000002\" (hai số trong một ô).", a: "Vi phạm 1NF", why: "Một ô chứa nhiều giá trị. Tách ra bảng riêng, mỗi số một dòng." },
  { q: "Bảng `account_holder(account_id, customer_id, customer_name)` với khoá chính gồm hai cột `(account_id, customer_id)`.", a: "Vi phạm 2NF", why: "`customer_name` chỉ phụ thuộc `customer_id`, tức một phần của khoá. Phải để tên ở bảng `customer`." },
  { q: "Bảng `customer(customer_id, sector_id, sector_description)`, khoá chính `customer_id`.", a: "Vi phạm 3NF", why: "`sector_description` phụ thuộc `sector_id`, một cột không phải khoá. Mô tả nhóm khách đã nằm ở bảng `sector`." },
  { q: "Bảng `account(account_id, customer_id, customer_city, ...)`, khoá chính `account_id`.", a: "Vi phạm 3NF", why: "`customer_city` suy ra được từ `customer_id`. Thành phố của khách chỉ nên lưu ở `customer.city`." },
  { q: "Bảng `stmt_entry` thật: khoá chính `stmt_entry_id`; `account_id`, `txn_code`, `ft_id` là khoá ngoại; các cột còn lại mô tả đúng bút toán đó.", a: "Đạt cả ba", why: "Mỗi ô một giá trị, khoá chính một cột, mọi cột thường chỉ nói về bút toán. Thông tin về tài khoản hay loại giao dịch nằm ở bảng của chúng." },
];

export function SqlErdNormalWidget() {
  return (
    <ChoiceDrill
      items={ITEMS.map((i) => ({ ...i, choices: CHOICES }))}
      summary="Ba câu hỏi theo thứ tự: mỗi ô có đúng một giá trị không (1NF)? mỗi cột có phụ thuộc cả khoá, không chỉ một phần (2NF)? mỗi cột có chỉ phụ thuộc khoá, không qua cột trung gian (3NF)?"
    />
  );
}
