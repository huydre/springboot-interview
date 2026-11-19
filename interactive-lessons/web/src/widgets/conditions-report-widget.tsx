import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const WHY = ["Matched", "Không chạy: thiếu class", "Không chạy: do property hoặc cấu hình"] as const;

/** Lines from the --debug Condition Evaluation Report of lab 4 (profile dev), study note 11.04. */
const ITEMS: ChoiceItem[] = [
  { q: "DataSourceAutoConfiguration", a: "Matched", why: "@ConditionalOnClass tìm thấy javax.sql.DataSource: Boot tạo HikariCP." },
  { q: "DataSourceAutoConfiguration.EmbeddedDatabaseConfiguration", a: "Không chạy: do property hoặc cấu hình", why: "Profile dev đã có spring.datasource.url nên Boot không tạo DB nhúng." },
  { q: "H2ConsoleAutoConfiguration", a: "Không chạy: thiếu class", why: "H2 chỉ ở scope test; lúc chạy app không có class đó." },
  { q: "WebMvcAutoConfiguration.ProblemDetailsErrorHandlingConfiguration", a: "Không chạy: do property hoặc cấu hình", why: "Không bật spring.mvc.problemdetails.enabled; lỗi đã do advice của mình xử lý." },
  { q: "HealthEndpointAutoConfiguration", a: "Matched", why: "marked as exposed by a 'management.endpoints.web.exposure' property." },
  { q: "AopAutoConfiguration...CglibAutoProxyConfiguration", a: "Matched", why: "spring.aop.proxy-target-class=true mặc định: TimingAspect bọc được class không có interface." },
];

export function ConditionsReportWidget() {
  return <ChoiceDrill items={ITEMS} choices={WHY} summary="Report có 4 phần: Positive matches, Negative matches, Exclusions, Unconditional classes. Chạy với --debug hoặc gọi /actuator/conditions." />;
}
