import { YesNoDrill, type DrillItem } from "../components/yes-no-drill";

/** Does a @Timed @Around advice run? The first two rows were measured (study note 04.05); the rest follow from CGLIB proxying. */
const ITEMS: DrillItem[] = [
  { q: "reportService.build() gọi từ bean khác", ok: true, why: "Qua proxy: đo được \"TIMING ReportService.build() took 62 ms\"." },
  { q: "buildAll() bên trong gọi this.build()", ok: false, why: "Self-invocation không qua proxy: đo được không có dòng TIMING nào." },
  { q: "@Timed trên method private", ok: false, why: "Subclass CGLIB không override được method private." },
  { q: "@Timed trên method final", ok: false, why: "Không override được." },
  { q: "new ReportService().build()", ok: false, why: "Object tự new không phải bean, không có proxy nào." },
  { q: "Gọi build() trong @PostConstruct của chính bean", ok: false, why: "Proxy chưa được tạo, this là object gốc." },
];

export function ProxyReachWidget() {
  return (
    <YesNoDrill
      prompt={<>Method <code>build()</code> có <code>@Timed</code> và một <code>@Around</code> aspect đo thời gian. Advice có chạy không?</>}
      items={ITEMS}
      yes="advice chạy"
      no="không chạy"
      summary="@Transactional, @Async, @Cacheable, @Retryable, @PreAuthorize và method validation đều chạy bằng proxy nên chung các điểm yếu này. Cách sửa tốt nhất: tách method sang bean khác."
    />
  );
}
