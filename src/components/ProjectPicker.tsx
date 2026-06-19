"use client";

import { Popover } from "./Popover";

// Small dropdown to file a task into a project. A project is required — there's
// no "Unfiled" option. The panel portals to the body (via Popover) so it isn't
// clipped inside scroll containers like the Add Task modal.
export default function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: { id: number; name: string }[];
  value: number | null; // null = not yet chosen
  onChange: (id: number) => void;
}) {
  const current = projects.find((p) => p.id === value) ?? null;

  return (
    <Popover
      triggerTitle="Choose a project"
      trigger={
        <span
          className={`inline-flex items-center text-[12px] rounded-full px-2.5 py-1 transition-colors max-w-[160px] ${
            current ? "bg-line/60 text-stone-600 hover:text-ink" : "bg-accent-50 text-accent-700 hover:bg-accent-100"
          }`}
        >
          <span className="truncate">{current ? current.name : "Choose project…"}</span>
        </span>
      }
    >
      {(close) => (
        <div className="bg-paper rounded-lg shadow-lg border border-stone-100 py-1 w-60 max-h-[240px] overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); close(); }}
              className={`w-full text-left px-3 py-1.5 text-[14px] hover:bg-stone-50 cursor-pointer truncate ${
                value === p.id ? "font-semibold text-ink" : "text-stone-600"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
