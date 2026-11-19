import { StepThrough, type Step } from "../components/step-through";

/** What TransactionInterceptor does on a call through the proxy; log lines from JpaTransactionManager at DEBUG (study note 05.01). */
const STEPS: Step[] = [
  { step: "Controller gọi probe.inTx()", detail: "ProbeService$$SpringCGLIB$$1", note: "Thứ được inject là proxy, không phải ProbeService. Advisor duy nhất: BeanFactoryTransactionAttributeSourceAdvisor với advice TransactionInterceptor." },
  { step: "1. Đọc metadata", detail: "PROPAGATION_REQUIRED,ISOLATION_DEFAULT", note: "Tìm @Transactional của method hoặc class. rollbackFor in thêm -java.lang.Exception, noRollbackFor in dấu +." },
  { step: "2. getTransaction()", detail: "Creating new transaction with name [demo.ProbeService.inTx]", note: "Tuỳ propagation: tạo mới, tham gia (Participating in existing transaction) hoặc tạm dừng transaction cũ." },
  { step: "3. Bind vào ThreadLocal", detail: "EntityManagerHolder, ConnectionHolder", note: "Opened new EntityManager · Exposing JPA transaction as JDBC: JdbcTemplate trên cùng thread chạy chung transaction. autoCommit = false, 1 connection đang mượn.", highlight: true },
  { step: "4. Gọi method thật", detail: "ProbeService.inTx()", note: "Mọi repository trên cùng thread tra ThreadLocal và lấy đúng connection này." },
  { step: "5. Kết thúc", detail: "Initiating transaction commit", note: "Trả về bình thường: commit. RuntimeException hoặc Error: rollback. Checked exception: mặc định VẪN commit. Exception bị catch nuốt mất thì interceptor không thấy.", highlight: true },
  { step: "6. Dọn dẹp", detail: "resource map: 0, connection mượn: 0", note: "Unbind khỏi ThreadLocal trong finally, trả connection về pool." },
];

export function TxStepsWidget() {
  return <StepThrough steps={STEPS} />;
}
