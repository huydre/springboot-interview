import { StepThrough, type Step } from "../components/step-through";

/** Callback order printed by a bean with every hook plus an @Async method, Spring Boot 3.5 (study note 04.02). */
const STEPS: Step[] = [
  { step: "BeanFactoryPostProcessor", detail: "(chưa có object)", note: "Đã có 17 bean definition, orderCache chưa được tạo. BFPP sửa bản vẽ, ví dụ thay ${...}." },
  { step: "1. constructor", detail: "OrderCache", note: "Constructor injection xảy ra ở đây." },
  { step: "2. setter / field injection", detail: "OrderCache" },
  { step: "3. BeanNameAware, ApplicationContextAware", detail: "OrderCache", note: "setBeanName(orderCache)." },
  { step: "4. BeanPostProcessor before", detail: "OrderCache", note: "Vẫn là object gốc." },
  { step: "5. @PostConstruct", detail: "OrderCache, proxy? false", note: "Chạy bên trong before-initialization của CommonAnnotationBeanPostProcessor. this là object gốc: gọi @Transactional, @Async của chính mình ở đây không qua proxy." },
  { step: "6. afterPropertiesSet()", detail: "OrderCache", note: "Init theo thứ tự: annotation, rồi interface, rồi cấu hình." },
  { step: "7. @Bean(initMethod)", detail: "OrderCache" },
  { step: "8. BeanPostProcessor after", detail: "OrderCache$$SpringCGLIB$$0", note: "AOP proxy được tạo và thay vào đây, bọc object đã khởi tạo xong.", highlight: true },
  { step: "9. Bean trong context", detail: "OrderCache$$SpringCGLIB$$0, proxy? true", note: "Bean trong context không phải object bạn new.", highlight: true },
  { step: "Đóng context", note: "@PreDestroy → destroy() → destroyMethod. Prototype không được gọi destroy: đo 7 Cart có @PreDestroy, không dòng nào in ra." },
];

export function BeanLifecycleWidget() {
  return <StepThrough steps={STEPS} />;
}
