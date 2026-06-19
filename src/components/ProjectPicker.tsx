"use client";

import { useState, useRef } from "react";
import { useOutsideDismiss } from "@/lib/useOutsideDismiss";

// Small dropdown to file a new task into a project. Used by the add-task form
// in the by-person view, where there's no project context. A project is
// required — there's no "Unfiled" option.
export default function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: { id: number; name: string }[];
  value: number | null; // null = not yet chosen
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useOutsideDismiss(open, ref, () => setOpen(false));

  const current = projects.find((p) => p.id === value) ?? null;

  return (
    <span className="relative inline-block align-baseline" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center text-[12px] rounded-full px-2.5 py-1 transition-colors cursor-pointer max-w-[160px] ${
          current ? "bg-line/60 text-stone-600 hover:text-ink" : "bg-accent-50 text-accent-700 hover:bg-accent-100"
        }`}
        title="Choose a project"
      >
        <span className="truncate">{current ? current.name : "Choose project…"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 bg-paper rounded-lg shadow-lg border border-stone-100 py-1 min-w-[160px] max-h-[240px] overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[14px] hover:bg-stone-50 cursor-pointer truncate ${
                value === p.id ? "font-semibold text-ink" : "text-stone-600"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
