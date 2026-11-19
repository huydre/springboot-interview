import { StepThrough, type Step } from "../components/step-through";

/** Events printed by a listener while a Boot 3.5 web app starts (study note 04.03). */
const STEPS: Step[] = [
  { step: "ApplicationStartingEvent", note: "Vừa bắt đầu, chưa có gì." },
  { step: "ApplicationEnvironmentPreparedEvent", note: "Environment sẵn sàng: file, env var, command-line, profile." },
  { step: "ApplicationContextInitializedEvent", detail: "AnnotationConfigServletWebServerApplicationContext", note: "Context đã tạo theo loại ứng dụng, chưa nạp definition." },
  { step: "ApplicationPreparedEvent", note: "Đã nạp bean definition, chưa refresh." },
  { step: "ServletWebServerInitializedEvent", note: "Tomcat khởi động bên trong pha refresh, trước khi refresh xong.", highlight: true },
  { step: "ContextRefreshedEvent", note: "Refresh xong: component scan, auto-config, BFPP, tạo singleton, BPP tạo proxy." },
  { step: "ApplicationStartedEvent" },
  { step: "CommandLineRunner.run", note: "Runner chạy trước ApplicationReadyEvent; ném exception là app fail.", highlight: true },
  { step: "ApplicationReadyEvent", note: "Sẵn sàng nhận traffic. Việc khởi động cần proxy, transaction đặt ở đây." },
];

export function StartupEventsWidget() {
  return <StepThrough steps={STEPS} />;
}
