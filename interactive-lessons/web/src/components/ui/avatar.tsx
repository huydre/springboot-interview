import { useId } from "react";

const SHIRTS = ["#8e2200", "#1f6f8b", "#2e7d32", "#6a1b9a", "#c2185b", "#37474f"];
const BACKS = ["#bcd8e4", "#f3dcc0", "#d5e8c8", "#e6d4ee", "#f6d2d8", "#d7dde2"];
const DISCS = ["#7fb7ec", "#f5b97a", "#8fd19e", "#c39bd3", "#f090a8", "#9fb0bd"];
const HATS = ["#f9a825", "#f2b134", "#e9b84d"];
const SKINS = ["#fbd2a8", "#f6c595", "#f2bb88"];

/** Stable small integer from any string, so the same user always gets the same character. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Default avatar: a cartoon character in a conical hat (nón lá). Colours vary with `seed` (use the user id). */
export function Avatar({ seed, size = 36, title }: { seed: string; size?: number; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const h = hash(seed);
  const shirt = SHIRTS[h % SHIRTS.length];
  const back = BACKS[(h >>> 3) % BACKS.length];
  const disc = DISCS[(h >>> 3) % DISCS.length];
  const hat = HATS[(h >>> 7) % HATS.length];
  const skin = SKINS[(h >>> 11) % SKINS.length];
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={title ?? "Ảnh đại diện"}>
      <defs><clipPath id={`av-${uid}`}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#av-${uid})`}>
        <rect width="100" height="100" fill={back} />
        <circle cx="50" cy="60" r="33" fill={disc} />
        {/* shirt with stand-up collar and gold frog buttons */}
        <path d="M14 104 C14 84 30 77 45 77 L55 77 C70 77 86 84 86 104Z" fill={shirt} />
        <path d="M43 77 Q50 83 57 77" fill="none" stroke="#f7c04a" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M57 80 L39 94" fill="none" stroke="#f7c04a" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="52" cy="85" r="1.5" fill="#f7c04a" /><circle cx="46" cy="90" r="1.5" fill="#f7c04a" /><circle cx="40" cy="94" r="1.5" fill="#f7c04a" />
        {/* neck, hair sides, ears, head */}
        <rect x="45" y="70" width="10" height="9" rx="2" fill={skin} />
        <rect x="30" y="46" width="6" height="17" rx="3" fill="#3b3b3b" /><rect x="64" y="46" width="6" height="17" rx="3" fill="#3b3b3b" />
        <circle cx="32" cy="58" r="4.2" fill={skin} /><circle cx="68" cy="58" r="4.2" fill={skin} />
        <ellipse cx="50" cy="57" rx="18" ry="19" fill={skin} />
        {/* face */}
        <path d="M37 49.5 Q42 46.5 46 49" fill="none" stroke="#3b3b3b" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M54 49 Q58 46.5 63 49.5" fill="none" stroke="#3b3b3b" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="42.5" cy="56" rx="2.3" ry="3.2" fill="#3b3b3b" /><ellipse cx="57.5" cy="56" rx="2.3" ry="3.2" fill="#3b3b3b" />
        <circle cx="43.2" cy="54.8" r="0.9" fill="#fff" /><circle cx="58.2" cy="54.8" r="0.9" fill="#fff" />
        <circle cx="37.5" cy="63" r="3.3" fill="#ef8a8a" opacity="0.6" /><circle cx="62.5" cy="63" r="3.3" fill="#ef8a8a" opacity="0.6" />
        <ellipse cx="50" cy="61.5" rx="1.6" ry="1" fill="#dc9a74" />
        <path d="M42.5 66 Q50 65 57.5 66 Q56 74 50 74 Q44 74 42.5 66Z" fill="#c0392b" />
        <path d="M43.4 66.2 Q50 65.4 56.6 66.2 L56 68.4 Q50 67.6 44 68.4Z" fill="#fff" />
        {/* conical hat: darker underside of the brim, facets, lighter top */}
        <path d="M7 44 Q50 36 93 44 Q50 54 7 44Z" fill="#d9820b" />
        <path d="M50 8 L93 44 Q50 37 7 44Z" fill={hat} />
        <path d="M50 8 L30 41 M50 8 L50 38.5 M50 8 L70 41" stroke="#000" strokeOpacity="0.1" strokeWidth="1.4" fill="none" />
        <path d="M50 8 L93 44 Q72 40.5 62 39.3Z" fill="#fff" fillOpacity="0.14" />
      </g>
    </svg>
  );
}
