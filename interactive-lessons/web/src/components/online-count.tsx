import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Live "N đang online" pill using Supabase Realtime Presence. Each open tab joins one anonymous channel under a random key and
 * leaves it while hidden, so the number counts visitors who are looking at the site. Nothing personal is sent.
 * Renders nothing until the first count arrives, or when Supabase is not configured or the connection fails.
 */
export function OnlineCount() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel("online", { config: { presence: { key: crypto.randomUUID() } } });
    const join = () => { void channel.track({ at: Date.now() }); };
    channel
      .on("presence", { event: "sync" }, () => setN(Object.keys(channel.presenceState()).length))
      .subscribe((status) => { if (status === "SUBSCRIBED" && document.visibilityState === "visible") join(); });
    const onVisibility = () => { if (document.visibilityState === "visible") join(); else void channel.untrack(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void supabase?.removeChannel(channel);
    };
  }, []);

  if (n === null || n < 1) return null;
  return (
    <span className="online" title="Số người đang mở trang này ngay lúc này">
      <i className="online-dot" aria-hidden />
      {n} online
    </span>
  );
}
