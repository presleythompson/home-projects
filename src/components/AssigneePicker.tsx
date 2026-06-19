"use client";

import type { Person } from "@/lib/types";
import Avatar from "./Avatar";
import AvatarStack from "./AvatarStack";
import { Popover } from "./Popover";

// Multi-select assignee picker. Tapping a person toggles their membership; the
// popover stays open so several can be picked. Tap outside (or Escape) closes.
export default function AssigneePicker({
  people,
  assigneeIds,
  currentPersonId,
  onToggle,
  onClear,
  trigger,
}: {
  people: Person[];
  assigneeIds: number[];
  currentPersonId: number | null;
  onToggle: (personId: number) => void;
  onClear: () => void;
  trigger?: React.ReactNode;
}) {
  const selected = people.filter((p) => assigneeIds.includes(p.id));

  const defaultTrigger =
    selected.length > 0 ? (
      <AvatarStack people={selected} size={24} />
    ) : (
      <span className="w-6 h-6 rounded-full border border-dashed border-stone-300 text-stone-300 flex items-center justify-center text-[13px] hover:border-accent-400 hover:text-accent-400 transition-colors">
        +
      </span>
    );

  return (
    <Popover
      triggerClassName="inline-flex items-center cursor-pointer align-baseline"
      triggerTitle={selected.length ? `Assigned to ${selected.map((p) => p.name).join(", ")}` : "Unassigned — click to assign"}
      trigger={trigger ?? defaultTrigger}
    >
      {(close) => (
        <div className="bg-paper rounded-lg shadow-lg border border-stone-100 py-1 w-52">
          {currentPersonId != null && (
            <button
              onClick={() => onToggle(currentPersonId)}
              className="w-full text-left px-3.5 py-2 text-[15px] font-medium text-accent-600 hover:bg-accent-50 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              {assigneeIds.includes(currentPersonId) ? "Unassign me" : "Assign to me"}
            </button>
          )}
          {people.map((p) => {
            const on = assigneeIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`w-full text-left px-3.5 py-2 text-[15px] flex items-center gap-2.5 hover:bg-stone-50 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px] sm:gap-2 ${
                  on ? "font-semibold" : "text-stone-600"
                }`}
              >
                <Avatar person={p} size={20} />
                <span className="flex-1 min-w-0 truncate">{p.name}</span>
                {on && <span className="text-accent-600 flex-shrink-0">✓</span>}
              </button>
            );
          })}
          {assigneeIds.length > 0 && (
            <button
              onClick={() => { onClear(); close(); }}
              className="w-full text-left px-3.5 py-2 text-[15px] text-stone-400 hover:bg-stone-50 border-t border-stone-100 mt-1 cursor-pointer sm:px-3 sm:py-1.5 sm:text-[14px]"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}
