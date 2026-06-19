"use client";

import { useState } from "react";
import { todayYmd } from "@/lib/util";
import { Popover } from "./Popover";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

// A compact calendar popover. Shows month + day only (no year), though it
// tracks the year internally so the stored date stays correct. The panel portals
// to the body (via Popover) so it isn't clipped inside scroll containers.
export default function DatePicker({
  value,
  onChange,
  trigger,
}: {
  value: string | null;
  onChange: (ymd: string | null) => void;
  trigger: React.ReactNode;
}) {
  return (
    <Popover trigger={trigger}>
      {(close) => <Calendar value={value} onChange={onChange} close={close} />}
    </Popover>
  );
}

// Rendered only while open (so it mounts fresh each time) — the visible month
// initializes to the selected date / today on every open.
function Calendar({
  value,
  onChange,
  close,
}: {
  value: string | null;
  onChange: (ymd: string | null) => void;
  close: () => void;
}) {
  const today = todayYmd();
  const base = value ?? today;
  const [view, setView] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function step(delta: number) {
    setView((v) => {
      const m = v.m + delta;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
  }

  function pick(day: number) {
    onChange(`${view.y}-${pad(view.m + 1)}-${pad(day)}`);
    close();
  }

  return (
    <div className="bg-paper rounded-xl shadow-lg border border-line p-3 w-64 max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => step(-1)}
          className="w-7 h-7 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
          title="Previous month"
        >
          ‹
        </button>
        <span className="font-display text-[16px] font-semibold text-ink">{MONTHS[view.m]}</span>
        <button
          onClick={() => step(1)}
          className="w-7 h-7 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors flex items-center justify-center cursor-pointer"
          title="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[11px] font-semibold text-stone-400 text-center py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const ymd = `${view.y}-${pad(view.m + 1)}-${pad(day)}`;
          const isSelected = ymd === value;
          const isToday = ymd === today;
          return (
            <button
              key={i}
              onClick={() => pick(day)}
              className={`h-8 rounded-lg text-[13px] cursor-pointer transition-colors ${
                isSelected
                  ? "bg-accent-500 text-white font-semibold"
                  : isToday
                  ? "text-accent-700 font-semibold ring-1 ring-accent-200 hover:bg-accent-50"
                  : "text-ink hover:bg-accent-50"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <button
          onClick={() => { onChange(null); close(); }}
          className="mt-2 w-full rounded-lg px-3 py-1.5 text-[13px] font-medium text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          Clear date
        </button>
      )}
    </div>
  );
}
