import { ChoiceDrill, type ChoiceItem } from "../components/choice-drill";

const KINDS = ["Filter", "Interceptor", "AOP"] as const;

/** Picking the right layer, following the rules in study note 04.04. */
const ITEMS: ChoiceItem[] = [
  { q: "Gắn traceId vào MDC cho mọi request", a: "Filter", why: "Việc HTTP thô cho mọi request. Nhớ MDC.remove trong finally vì thread của Tomcat được tái sử dụng." },
  { q: "Log thời gian mọi request, kể cả 404 vì sai URL", a: "Filter", why: "Filter thấy mọi request. Sai URL thì Boot vẫn đưa vào ResourceHttpRequestHandler nên Interceptor có chạy nhưng không có controller nào; aspect quanh controller thì không chạy. Filter là chỗ chắc chắn nhất." },
  { q: "Chặn controller có annotation @AdminOnly", a: "Interceptor", why: "Cần biết handler nào sẽ xử lý để đọc annotation trên nó." },
  { q: "Đổi locale theo header cho các endpoint /api/**", a: "Interceptor", why: "Quanh handler, đăng ký theo path pattern trong WebMvcConfigurer." },
  { q: "Đo thời gian method của tầng service", a: "AOP", why: "Không liên quan HTTP, áp dụng cho mọi bean." },
  { q: "Retry khi gọi payment client lỗi tạm thời", a: "AOP", why: "Việc nghiệp vụ quanh method, cùng họ với @Transactional, @Cacheable." },
];

export function FilterInterceptorAopWidget() {
  return (
    <ChoiceDrill
      items={ITEMS}
      choices={KINDS}
      summary="Filter thuộc Servlet API, đứng trước DispatcherServlet; Interceptor thuộc Spring MVC, thấy handler; AOP bọc method của mọi bean. Exception trong Filter không tới @RestControllerAdvice."
    />
  );
}
