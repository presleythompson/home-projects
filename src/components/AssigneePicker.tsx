"use client";

import type { Person } from "@/lib/types";
import Avatar from "./Avatar";
import { Popover } from "./Popover";

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
  const assignee = people.find((p) => p.id === assigneeId) ?? null;

  const defaultTrigger = assignee ? (
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
  );

  return (
    <Popover
      triggerClassName="inline-flex items-center cursor-pointer align-baseline"
      triggerTitle={assignee ? `Assigned to ${assignee.name}` : "Unassigned — click to assign"}
      trigger={trigger ?? defaultTrigger}
    >
      {(close) => (
        <div className="bg-paper rounded-lg shadow-lg border border-stone-100 py-1 w-52">
          {currentPersonId != null && currentPersonId !== assigneeId && (
            <button
              onClick={() => { onAssign(currentPersonId); close(); }}
              className="w-full text-left px-3.5 py-2 text-[15px] font-medium text-accent-600 hover:bg-accent-50 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              Assign to me
            </button>
          )}
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => { onAssign(p.id); close(); }}
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
              onClick={() => { onAssign(null); close(); }}
              className="w-full text-left px-3.5 py-2 text-[15px] text-stone-400 hover:bg-stone-50 border-t border-stone-100 mt-1 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              Unassign
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}
