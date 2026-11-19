import { StepThrough, type Step } from "../components/step-through";

/** Reading the jstack dump of DeadlockLab --hold on JDK 21, line by line (study note 11.03). */
const STEPS: Step[] = [
  { step: "java DeadlockLab.java --hold", detail: "dòng đầu in PID = ...", note: "Chạy kiểu single-file thì jps -l chỉ hiện jdk.compiler/com.sun.tools.javac.launcher.Main, nên dùng PID chương trình tự in." },
  { step: "jstack <pid>", detail: "thread dump của mọi thread", note: "Kéo xuống cuối để tìm phần deadlock." },
  { step: "Found one Java-level deadlock:", highlight: true, note: "JVM tự phát hiện vòng chờ giữa các monitor." },
  { step: "\"worker-1\": waiting to lock monitor ... (object 0x...f790) which is held by \"worker-2\"", note: "worker-1 đang chờ object f790, worker-2 giữ nó." },
  { step: "\"worker-2\": waiting to lock monitor ... (object 0x...f780) which is held by \"worker-1\"", note: "Ngược lại: vòng chờ khép kín." },
  { step: "worker-1 tại DeadlockLab.java:37, chờ <0x...f790>, giữ <0x...f780>", note: "Dòng 37 là khối synchronized (second): chỗ cần xem lại thứ tự lấy lock." },
  { step: "Trạng thái: BLOCKED (on object monitor)", note: "getState() sau 1 giây cũng ra worker-1=BLOCKED, worker-2=BLOCKED." },
  { step: "Found 1 deadlock.", highlight: true, note: "Sửa: mọi thread lấy lock cùng thứ tự A rồi B; lặp 100.000 lần cả hai thread xong trong 5 giây. Trong code: ThreadMXBean.findDeadlockedThreads()." },
];

export function JstackReadWidget() {
  return <StepThrough steps={STEPS} />;
}
