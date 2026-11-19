import { useState } from "react";

type End = "orElse" | "orElseThrow";

/** findById(id).map(User::address).map(Address::city).<end>; user 1 has an address in Hà Nội, user 2 has none, user 3 does not exist. JDK 21 output. */
const USERS: { id: number; label: string; steps: [string, string, string]; city: string | null }[] = [
  { id: 1, label: "user 1: có địa chỉ", steps: ["Optional[User[name=An, …]]", "Optional[Address[city=Hà Nội]]", "Optional[Hà Nội]"], city: "Hà Nội" },
  { id: 2, label: "user 2: không có địa chỉ", steps: ["Optional[User[name=Bình, address=null]]", "Optional.empty", "Optional.empty (bỏ qua)"], city: null },
  { id: 3, label: "user 3: không tồn tại", steps: ["Optional.empty", "Optional.empty (bỏ qua)", "Optional.empty (bỏ qua)"], city: null },
];

export function OptionalChainWidget() {
  const [id, setId] = useState(2);
  const [end, setEnd] = useState<End>("orElse");
  const u = USERS.find((x) => x.id === id)!;
  const endCode = end === "orElse" ? '.orElse("UNKNOWN")' : ".orElseThrow()";
  const result = u.city ?? (end === "orElse" ? "UNKNOWN" : "NoSuchElementException: No value present");
  const tone = u.city ? "good" : end === "orElse" ? "warn" : "bad";
  return (
    <div className="widget">
      <div className="seg small">
        {USERS.map((x) => <button key={x.id} className={id === x.id ? "on" : ""} onClick={() => setId(x.id)}>{x.label}</button>)}
      </div>
      <div className="seg small">
        {(["orElse", "orElseThrow"] as End[]).map((e) => <button key={e} className={end === e ? "on" : ""} onClick={() => setEnd(e)}>{e}</button>)}
      </div>
      <ul className="log">
        <li>findById({id}) → {u.steps[0]}</li>
        <li>.map(User::address) → {u.steps[1]}</li>
        <li>.map(Address::city) → {u.steps[2]}</li>
        <li className={u.city ? "ok" : end === "orElse" ? "" : "err"}>{endCode} → {result}</li>
      </ul>
      <div className={`result ${tone}`}>
        {result}
        <small>{u.city ? "đi hết chuỗi, không cần một dòng if nào" : "hộp rỗng thì map bỏ qua, chỉ bước cuối quyết định giá trị mặc định hoặc exception"}</small>
      </div>
    </div>
  );
}
