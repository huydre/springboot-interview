import { useState } from "react";

/** The same key payment.url set in several sources; precedence measured on Boot 3.5 (study note 04.03), highest first. The dev, app and default URLs are placeholders. */
const SOURCES = [
  { id: "cli", label: "--payment.url=https://cli.local", value: "https://cli.local" },
  { id: "env", label: "env PAYMENT_URL=https://env.local", value: "https://env.local" },
  { id: "dev", label: "application-dev.properties (profile dev)", value: "https://dev.local" },
  { id: "app", label: "application.properties", value: "https://app.local" },
  { id: "def", label: "setDefaultProperties", value: "https://default.local" },
];

export function PropertyPrecedenceWidget() {
  const [on, setOn] = useState<Record<string, boolean>>({ cli: false, env: true, dev: true, app: true, def: true });
  const winner = SOURCES.find((s) => on[s.id]);
  return (
    <div className="widget">
      <p className="muted">Bật tắt từng nguồn có đặt payment.url (xếp từ ưu tiên cao xuống thấp):</p>
      <div className="seg small">
        {SOURCES.map((s) => <button key={s.id} className={on[s.id] ? "on" : ""} onClick={() => setOn((o) => ({ ...o, [s.id]: !o[s.id] }))}>{s.label}</button>)}
      </div>
      <div className={`result ${winner ? "good" : "bad"}`}>
        {winner ? `payment.url = ${winner.value}` : "Không nguồn nào có: @Value(\"${payment.url}\") fail khi start với PlaceholderResolutionException"}
        <small>
          {winner && `Lấy từ: ${winner.label}. `}
          Command-line thắng env var, env var thắng cả file profile. File ngoài JAR (./config/application.yml) thắng file trong JAR cùng loại. Xem giá trị cuối cùng và nguồn của nó ở /actuator/env trên management port nội bộ.
        </small>
      </div>
    </div>
  );
}
