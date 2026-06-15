"use client";

import { useState, useRef, useEffect } from "react";
import type { Person } from "@/lib/types";

export default function AssigneePicker({
  people,
  assigneeId,
  currentPersonId,
  onAssign,
}: {
  people: Person[];
  assigneeId: number | null;
  currentPersonId: number | null;
  onAssign: (personId: number | null) => void;
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center"
        title={assignee ? `Assigned to ${assignee.name}` : "Unassigned — click to assign"}
      >
        {assignee ? (
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-black/5"
            style={{ background: assignee.color }}
          >
            {assignee.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <span className="w-6 h-6 rounded-full border border-dashed border-slate-300 text-slate-300 flex items-center justify-center text-[13px] hover:border-accent-400 hover:text-accent-400 transition-colors">
            +
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-slate-100 py-1 min-w-[150px]">
          {currentPersonId != null && currentPersonId !== assigneeId && (
            <button
              onClick={() => { onAssign(currentPersonId); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[14px] font-medium text-accent-600 hover:bg-accent-50"
            >
              Assign to me
            </button>
          )}
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAssign(p.id); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[14px] flex items-center gap-2 hover:bg-slate-50 ${
                p.id === assigneeId ? "font-semibold" : "text-slate-600"
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
              className="w-full text-left px-3 py-1.5 text-[14px] text-slate-400 hover:bg-slate-50 border-t border-slate-100 mt-1"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
