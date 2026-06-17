"use client";

import { useState, useRef, useEffect } from "react";
import type { Person } from "@/lib/types";
import Avatar from "./Avatar";

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
        <div className="absolute right-0 top-full mt-1 z-40 bg-paper rounded-lg shadow-lg border border-stone-100 py-1 min-w-[172px] sm:min-w-[150px]">
          {currentPersonId != null && currentPersonId !== assigneeId && (
            <button
              onClick={() => { onAssign(currentPersonId); setOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-[15px] font-medium text-accent-600 hover:bg-accent-50 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              Assign to me
            </button>
          )}
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAssign(p.id); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-[15px] flex items-center gap-2.5 hover:bg-stone-50 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px] sm:gap-2 ${
                p.id === assigneeId ? "font-semibold" : "text-stone-600"
              }`}
            >
              <Avatar person={p} size={20} />
              {p.name}
            </button>
          ))}
          {assigneeId != null && (
            <button
              onClick={() => { onAssign(null); setOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-[15px] text-stone-400 hover:bg-stone-50 border-t border-stone-100 mt-1 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </span>
  );
}
