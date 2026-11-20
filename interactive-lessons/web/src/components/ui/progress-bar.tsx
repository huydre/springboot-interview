/** Thin progress bar with a `done/total` label; shared by every drill. */
export function ProgressBar({ done, total, label = "Đã trả lời" }: { done: number; total: number; label?: string }) {
  return (
    <div className="dq-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${label} ${done}/${total}`}>
      <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      <span>{done}/{total}</span>
    </div>
  );
}
