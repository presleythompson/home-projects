"use client";

export default function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    // Fills its container: the track flexes, the count pins to the right edge.
    // Parents control overall width (compact slot on desktop, full row on mobile).
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            pct === 100 ? "bg-accent-500" : "bg-accent-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] font-semibold text-muted tabular-nums flex-shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}
