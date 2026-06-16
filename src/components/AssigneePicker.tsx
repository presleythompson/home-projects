"use client";

import { useState, useRef, useEffect } from "react";
import type { Person } from "@/lib/types";

export default function AssigneePicker({
  people,
  assigneeId,
  currentPersonId,
  onAssign,
  trigger,
}: {
  people: Person[];
  assigneeId: number | null;
  currentPersonId: number | null;
  onAssign: (personId: number | null) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const assignee = people.find((p) => p.id === assigneeId) ?? null;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span className="relative inline-block align-baseline" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center cursor-pointer align-baseline"
        title={assignee ? `Assigned to ${assignee.name}` : "Unassigned — click to assign"}
      >
        {trigger ? (
          trigger
        ) : assignee ? (
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-black/5"
            style={{ background: assignee.color }}
          >
            {assignee.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span className="w-6 h-6 rounded-full border border-dashed border-stone-300 text-stone-300 flex items-center justify-center text-[13px] hover:border-accent-400 hover:text-accent-400 transition-colors">
            +
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:translate-x-0 sm:translate-y-0 sm:mt-1 bg-paper rounded-lg shadow-lg border border-stone-100 py-1 min-w-[150px]">
          {currentPersonId != null && currentPersonId !== assigneeId && (
            <button
              onClick={() => { onAssign(currentPersonId); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[14px] font-medium text-accent-600 hover:bg-accent-50 cursor-pointer"
            >
              Assign to me
            </button>
          )}
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAssign(p.id); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[14px] flex items-center gap-2 hover:bg-stone-50 cursor-pointer ${
                p.id === assigneeId ? "font-semibold" : "text-stone-600"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ background: p.color }}
              />
              {p.name}
            </button>
          ))}
          {assigneeId != null && (
            <button
              onClick={() => { onAssign(null); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[14px] text-stone-400 hover:bg-stone-50 border-t border-stone-100 mt-1 cursor-pointer"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </span>
  );
}
