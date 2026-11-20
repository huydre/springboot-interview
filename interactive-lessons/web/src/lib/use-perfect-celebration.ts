import { useEffect, useRef } from "react";
import { celebrateAt } from "./confetti";
import { toast } from "./toast";
import { markStudyDay } from "./cloud-progress";

/** Fires a confetti burst (and a toast) the first time every item of a drill is answered correctly. */
export function usePerfectCelebration(answered: number, right: number, total: number) {
  const root = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    if (answered > 0) void markStudyDay();
    if (fired.current || total === 0 || answered < total) return;
    fired.current = true;
    if (right === total) {
      celebrateAt(root.current);
      toast.success("Đúng hết!", `${total}/${total} câu, làm tốt lắm.`);
    }
  }, [answered, right, total]);
  return root;
}
