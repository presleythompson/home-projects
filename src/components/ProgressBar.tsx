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
    <div className="flex items-center gap-2.5">
      <div className="w-[90px] h-1 bg-line rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            pct === 100 ? "bg-accent-500" : "bg-accent-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[13px] font-semibold text-muted tabular-nums">
        {completed}/{total}
      </span>
    </div>
  );
}
