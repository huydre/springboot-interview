import { useState } from "react";
import { Code } from "../components/code-block";

const RATE = { motorbike: { label: "Motorbike", rate: 150_000 }, car: { label: "Car", rate: 700_000 } } as const;
type V = keyof typeof RATE;
type D = "none" | "weekly";

const CODE = `abstract class Vehicle {                      // abstraction + inheritance
  private final String plate;
  abstract long dailyRate();                  // mỗi loại xe tự quyết (polymorphism)
}
class Motorbike extends Vehicle { long dailyRate() { return 150_000; } }
class Car       extends Vehicle { long dailyRate() { return 700_000; } }

interface Discount { long apply(long total, long days); }     // Strategy
Discount NONE   = (total, days) -> total;
Discount WEEKLY = (total, days) -> days >= 7 ? total * 90 / 100 : total;

class Booking {                               // encapsulation
  private final Vehicle vehicle; private final LocalDate from, to;
  private final Discount discount; private boolean cancelled;
  Booking(Vehicle v, LocalDate from, LocalDate to, Discount d) {
    if (!to.isAfter(from)) throw new IllegalArgumentException("to must be after from");
    ...
  }
  long total() {
    if (cancelled) throw new IllegalStateException("booking cancelled");
    return discount.apply(vehicle.dailyRate() * days(), days());
  }
  void cancel() { cancelled = true; }
}`;

/** The rental-system capstone: pick a vehicle, a day count and a discount; the rules are the ones in the JDK 21 run. */
export function RentalWidget() {
  const [v, setV] = useState<V>("car");
  const [days, setDays] = useState(3);
  const [d, setD] = useState<D>("none");
  const [cancelled, setCancelled] = useState(false);

  let out: { text: string; ok: boolean };
  if (days <= 0) out = { text: "IllegalArgumentException: to must be after from", ok: false };
  else if (cancelled) out = { text: "IllegalStateException: booking cancelled", ok: false };
  else {
    const raw = RATE[v].rate * days;
    const total = d === "weekly" && days >= 7 ? Math.floor((raw * 90) / 100) : raw;
    out = { text: `total() = ${total.toLocaleString("vi-VN")} đ (${RATE[v].rate.toLocaleString("vi-VN")} × ${days} ngày${total !== raw ? ", giảm 10%" : ""})`, ok: true };
  }
  return (
    <div className="widget">
      <Code>{CODE}</Code>
      <div className="seg small">
        {(Object.keys(RATE) as V[]).map((k) => <button key={k} className={v === k ? "on" : ""} onClick={() => setV(k)}>new {RATE[k].label}()</button>)}
        <button className={d === "none" ? "on" : ""} onClick={() => setD("none")}>NONE</button>
        <button className={d === "weekly" ? "on" : ""} onClick={() => setD("weekly")}>WEEKLY</button>
      </div>
      <label className="muted">Số ngày thuê: <strong>{days}</strong> (0 = to trùng from){" "}
        <input type="range" min={0} max={10} value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </label>
      <div className="actions">
        <button className="btn" onClick={() => setCancelled(true)}>booking.cancel()</button>
        <button className="btn ghost" onClick={() => setCancelled(false)}>Đặt lại</button>
      </div>
      <div className={`result ${out.ok ? "good" : "bad"}`}>{out.text}</div>
    </div>
  );
}
