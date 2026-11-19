import { useState } from "react";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Same alphabet and algorithm as the Base62Demo run on JDK 21 in study note 10.02 (encode(125) = "21", encode(1e9) = "15FTGg"). */
function encode(n: bigint): string {
  if (n === 0n) return "0";
  let s = "";
  while (n > 0n) { s = ALPHABET[Number(n % 62n)] + s; n /= 62n; }
  return s;
}
function decode(s: string): bigint | null {
  let n = 0n;
  for (const c of s) {
    const d = ALPHABET.indexOf(c);
    if (d < 0) return null;
    n = n * 62n + BigInt(d);
  }
  return n;
}

const PRESETS: [string, bigint][] = [["125", 125n], ["1 tỉ", 1_000_000_000n], ["62^6 - 1", 62n ** 6n - 1n], ["62^6", 62n ** 6n]];

export function Base62Widget() {
  const [id, setId] = useState(1_000_000_000n);
  const [code, setCode] = useState("aZ3kQ9x");
  const decoded = decode(code);
  return (
    <div className="widget">
      <div className="seg small">
        {PRESETS.map(([k, v]) => <button key={k} className={id === v ? "on" : ""} onClick={() => setId(v)}>{k}</button>)}
        <button onClick={() => setId((x) => x + 1n)}>id kế tiếp</button>
      </div>
      <div className="result good">
        encode({id.toString()}) = {encode(id)}
        <small>{encode(id).length} ký tự. Sequence + Base62 không bao giờ trùng nhưng đoán được: bấm "id kế tiếp" thường chỉ thấy ký tự cuối đổi.</small>
      </div>
      <div className="pick">
        <span>Giải mã</span>
        <input value={code} onChange={(e) => setCode(e.target.value.trim())} />
      </div>
      <div className={`result ${decoded === null ? "bad" : ""}`}>
        {decoded === null ? "Có ký tự ngoài bảng 0-9, a-z, A-Z" : `decode("${code}") = ${decoded.toLocaleString("vi-VN")}`}
        <small>Muốn mã khó đoán: sinh ngẫu nhiên rồi dựa vào unique index để thử lại khi trùng, hoặc xáo trộn id trước khi mã hoá.</small>
      </div>
    </div>
  );
}
