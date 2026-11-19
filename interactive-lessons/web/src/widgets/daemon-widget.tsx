import { useState } from "react";

/** A child thread prints tick 1..5 every 200 ms; main sleeps 500 ms then ends. Both outputs observed on JDK 21. */
const OUTPUT = {
  nondaemon: ["tick 1", "tick 2", "main ends", "tick 3", "tick 4", "tick 5"],
  daemon: ["tick 1", "tick 2", "main ends"],
};

export function DaemonWidget() {
  const [daemon, setDaemon] = useState(false);
  const lines = daemon ? OUTPUT.daemon : OUTPUT.nondaemon;
  return (
    <div className="widget">
      <div className="seg">
        <button className={!daemon ? "on" : ""} onClick={() => setDaemon(false)}>setDaemon(false)</button>
        <button className={daemon ? "on" : ""} onClick={() => setDaemon(true)}>setDaemon(true)</button>
      </div>
      <div className="two">
        <pre className="code">{`Thread t = new Thread(() -> {
    for (int i = 1; i <= 5; i++) { sleep(200); print("tick " + i); }
});
t.setDaemon(${daemon});   // trước start()
t.start();
Thread.sleep(500);
print("main ends");`}</pre>
        <ul className="log">
          {lines.map((l) => <li key={l} className={l === "main ends" ? "" : "ok"}>{l}</li>)}
          {daemon && <li className="err">(JVM thoát: tick 3–5 không bao giờ in)</li>}
        </ul>
      </div>
      <div className={`result ${daemon ? "warn" : "good"}`}>
        {daemon ? "JVM không chờ daemon thread" : "JVM chờ mọi thread non-daemon chạy xong"}
        <small>{daemon ? "Việc dở dang bị cắt ngang, không gì đảm bảo finally được chạy: đừng ghi file, gửi message trên daemon thread." : "Quên đóng pool thread non-daemon thì ứng dụng console không chịu thoát."}</small>
      </div>
    </div>
  );
}
