import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const KINDS = ["Penetration", "Stampede", "Avalanche"] as const;

/** The three cache-aside incidents and their fixes (study note 06, diagram 12). */
const ITEMS: ChoiceItem[] = [
  { q: "Bot gọi liên tục product id không tồn tại, mọi request đều xuống DB", a: "Penetration", why: "Key không bao giờ có trong cache. Cache giá trị rỗng với TTL ngắn, hoặc Bloom filter." },
  { q: "Key trang chủ hết hạn, 5 000 request cùng lúc đi SELECT", a: "Stampede", why: "Key nóng hết hạn. Lock hoặc single-flight để chỉ một request load lại." },
  { q: "Nạp cache lúc deploy với cùng TTL 1 giờ, đúng 1 giờ sau DB quá tải", a: "Avalanche", why: "Nhiều key hết hạn cùng lúc. TTL có jitter." },
  { q: "Tìm kiếm với id âm hoặc chuỗi rác", a: "Penetration", why: "Validate đầu vào trước, rồi cache giá trị rỗng." },
  { q: "Redis restart, toàn bộ cache trống", a: "Avalanche", why: "Cùng hiệu ứng nhiều key mất một lúc: warm-up dần, rate limit xuống DB." },
];

export function CacheIncidentWidget() {
  return <ChoiceDrill items={ITEMS} choices={KINDS} summary="Ghi theo cache-aside: UPDATE DB rồi DEL key, lần đọc sau tự load lại." />;
}
