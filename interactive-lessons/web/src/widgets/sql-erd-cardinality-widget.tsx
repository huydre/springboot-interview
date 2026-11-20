import { ChoiceDrill } from "../components/choice-drill";
import type { ChoiceItem } from "../components/choice-drill";

/** Facts about T24 tables were checked against the dataset: each loan has its own account (15 loans, 15 distinct accounts), customers hold 1 to 4 accounts. */
const ITEMS: ChoiceItem[] = [
  { q: "`customer` và `account`: một khách hàng có thể mở nhiều tài khoản, mỗi tài khoản (trong T24 giả lập) thuộc đúng một khách hàng.", a: "1-N", why: "Cột `account.customer_id` là khoá ngoại nằm ở phía \"nhiều\". Trong dữ liệu, 40 khách đều có tài khoản, mỗi người từ 1 đến 4." },
  { q: "`company` và `account_officer`: một chi nhánh có nhiều cán bộ, mỗi cán bộ làm ở đúng một chi nhánh.", a: "1-N", why: "Khoá ngoại `account_officer.company_id` nằm ở bảng cán bộ, phía \"nhiều\"." },
  { q: "`txn_type` và `stmt_entry`: mỗi bút toán thuộc một loại giao dịch, một loại giao dịch (ví dụ 101 nộp tiền) có rất nhiều bút toán.", a: "1-N", why: "Loại giao dịch là danh mục, được nhiều bút toán trỏ tới." },
  { q: "`customer` và `category` (loại sản phẩm), nhìn qua các tài khoản: một khách có thể có tài khoản thanh toán lẫn tiết kiệm, một loại sản phẩm có nhiều khách dùng.", a: "N-N", why: "Hai bên đều \"nhiều\". Bảng `account` chính là bảng trung gian: mỗi dòng nối một khách với một loại sản phẩm." },
  { q: "`account` và `account` qua chuyển khoản: một tài khoản có thể chuyển đi và nhận về nhiều lần, với nhiều tài khoản khác nhau.", a: "N-N", why: "Bảng `funds_transfer` là bảng trung gian với hai khoá ngoại `debit_account` và `credit_account`, cùng trỏ về `account`." },
  { q: "Một **khoản vay** (`loan`) và **tài khoản vay** của nó: mỗi khoản vay có một tài khoản riêng, và mỗi tài khoản vay chỉ phục vụ một khoản vay.", a: "1-1", why: "Dữ liệu có 15 khoản vay trên 15 tài khoản khác nhau. Lưu ý: lược đồ không có ràng buộc UNIQUE nên chính database không cấm 1-N, đây là quy ước của nghiệp vụ." },
  { q: "Tài khoản **đồng sở hữu** (vợ chồng cùng đứng tên một tài khoản): khách hàng và tài khoản, khi cho phép nhiều người cùng đứng tên.", a: "N-N", why: "Một khách có nhiều tài khoản, một tài khoản có nhiều chủ. Phải thêm bảng trung gian (bài tập thiết kế bên dưới). T24 giả lập chưa có, nên chưa có trong dữ liệu." },
  { q: "Một **công dân** và **số căn cước** của họ: mỗi người đúng một số, mỗi số thuộc đúng một người.", a: "1-1", why: "Ví dụ ngoài dữ liệu T24: 1-1 thường cài đặt bằng cách cho khoá ngoại cũng là khoá chính của bảng phụ." },
];

export function SqlErdCardinalityWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={["1-1", "1-N", "N-N"]}
      summary={"Mẹo: đặt hai câu hỏi, \"mỗi A có tối đa mấy B?\" và \"mỗi B có tối đa mấy A?\". Hai đáp án \"một\" là 1-1, một \"một\" một \"nhiều\" là 1-N, hai \"nhiều\" là N-N."}
    />
  );
}
