"use client";

import { useState, useRef, useEffect } from "react";
import { todayYmd } from "@/lib/util";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

// A compact calendar popover. Shows month + day only (no year), though it
// tracks the year internally so the stored date stays correct.
export default function DatePicker({
  value,
  onChange,
  trigger,
}: {
  value: string | null;
  onChange: (ymd: string | null) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = todayYmd();

  const base = value ?? today;
  const [view, setView] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });

  // Reset the visible month to the selected date (or today) each time it opens.
  useEffect(() => {
    if (open) {
      const b = value ?? today;
      setView({ y: Number(b.slice(0, 4)), m: Number(b.slice(5, 7)) - 1 });
    }
  }, [open, value, today]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

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
    setOpen(false);
  }

  return (
    <span className="relative inline-block align-baseline" ref={ref}>
      <span onClick={() => setOpen((v) => !v)} className="inline-flex cursor-pointer">
        {trigger}
      </span>

      {open && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:translate-x-0 sm:translate-y-0 sm:mt-1.5 bg-paper rounded-xl shadow-lg border border-line p-3 w-64 max-w-[calc(100vw-2rem)]">
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
              onClick={() => { onChange(null); setOpen(false); }}
              className="mt-2 w-full rounded-lg px-3 py-1.5 text-[13px] font-medium text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </span>
  );
}
