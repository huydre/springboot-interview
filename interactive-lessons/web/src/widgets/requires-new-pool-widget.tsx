import { useState } from "react";

/** HikariCP active connections inside outer and inner REQUIRES_NEW, and the 1-connection pool run (study note 05.03). */
export function RequiresNewPoolWidget() {
  const [pool, setPool] = useState(10);
  const starved = pool === 1;
  return (
    <div className="widget">
      <div className="seg small">
        <button className={pool === 10 ? "on" : ""} onClick={() => setPool(10)}>pool 10 (mặc định)</button>
        <button className={starved ? "on" : ""} onClick={() => setPool(1)}>maximum-pool-size=1, timeout 500 ms</button>
      </div>
      <div className="bars">
        <div>Trong outer: 1 connection<i className="good" style={{ width: "40%" }} /></div>
        <div>Trong inner REQUIRES_NEW: {starved ? "chờ connection thứ 2..." : "2 connection"}<i className={starved ? "bad" : "good"} style={{ width: "80%" }} /></div>
      </div>
      <div className={`result ${starved ? "bad" : "good"}`}>
        {starved ? "CannotCreateTransactionException sau 533 ms" : "Chạy được, nhưng một request chiếm 2 connection"}
        <small>{starved
          ? "HikariPool-2 - Connection is not available, request timed out after 504ms (total=1, active=1, idle=0, waiting=0). Outer giữ connection duy nhất trên cùng thread."
          : "Production: 10 request cùng vào, mỗi request giữ 1 connection rồi cùng chờ connection thứ hai: pool deadlock, treo tới connection-timeout 30 giây rồi lỗi hàng loạt. Local 1 request mỗi lúc nên không thấy."}</small>
      </div>
    </div>
  );
}
