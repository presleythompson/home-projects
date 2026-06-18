"use client";

import { useRef, useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Person, Task } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import { useOutsideDismiss } from "@/lib/useOutsideDismiss";
import EditableText from "./EditableText";
import AssigneePicker from "./AssigneePicker";
import DatePicker from "./DatePicker";
import Avatar from "./Avatar";
import { CalendarIcon, PersonIcon, TrashIcon, GripIcon } from "./icons";

// Warm→cool urgency gradient: terracotta (overdue) → deep amber (today) →
// light amber (this week) → denim (later). Green is reserved for "done".
const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-700",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-accent-50 text-accent-700",
  none: "bg-info-50 text-info-700",
};

export default function TaskRow({
  task,
  people,
  currentPersonId,
  onToggle,
  onRename,
  onAssign,
  onSetDue,
  onDelete,
  projectLabel,
  dragAttributes,
  dragListeners,
  setActivatorNodeRef,
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
  projectLabel?: string;
  // Provided by SortableTaskList: the drag activator goes on the grip that
  // replaces the checkbox while the row is "active" (its title was tapped).
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
}) {
  // "active" = the row has been opened by tapping its title. It shows the grip
  // (in place of the checkbox) + trash, and stays open until you tap outside —
  // crucially it does NOT end when the title input blurs (grabbing the grip
  // blurs it), so the grip survives the drag.
  const [active, setActive] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  useOutsideDismiss(active, rowRef, () => setActive(false));

  const due = dueLabel(task.due_date);
  const assignee = people.find((p) => p.id === task.assignee_id) ?? null;
  const showGrip = active && !!dragListeners;

  return (
    // items-start + a fixed 24px line height (leading-6) so every control aligns
    // to the FIRST line of the title, even when the title wraps.
    <div ref={rowRef} data-edit-group className="group flex items-start gap-2.5 py-2.5">
      <span className="flex items-center h-6 flex-shrink-0">
        {showGrip ? (
          <button
            ref={setActivatorNodeRef}
            {...dragAttributes}
            {...dragListeners}
            className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
            aria-label="Drag to reorder task"
          >
            <GripIcon className="w-[18px] h-[18px]" />
          </button>
        ) : (
          <input type="checkbox" checked={task.is_done} onChange={() => onToggle(task)} />
        )}
      </span>

      {/* Title — click to edit in place. Optional project tag below (people view). */}
      <span className="flex-1 min-w-0">
        <span className={`block text-[16px] leading-6 ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
          <EditableText
            value={task.title}
            onSave={(v) => onRename(task.id, v)}
            onEditingChange={(editing) => { if (editing) setActive(true); }}
          />
        </span>
        {projectLabel && (
          <span className="block mt-0.5 text-[12px] text-muted truncate">{projectLabel}</span>
        )}
      </span>

      {/* Date — click to pick */}
      <DatePicker
        value={task.due_date}
        onChange={(d) => onSetDue(task.id, d)}
        trigger={
          task.due_date ? (
            <span className="inline-flex items-center h-6">
              <span className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_BADGE[due.tone]}`} title="Change due date">
                {due.text}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center h-6 text-stone-400 hover:text-accent-500 transition-colors" title="Set a due date">
              <CalendarIcon />
            </span>
          )
        }
      />

      {/* Person — click to assign */}
      <AssigneePicker
        people={people}
        assigneeId={task.assignee_id}
        currentPersonId={currentPersonId}
        onAssign={(pid) => onAssign(task.id, pid)}
        trigger={
          assignee ? (
            <Avatar person={assignee} size={24} />
          ) : (
            <span
              className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-400 transition-colors"
              title="Assign someone"
            >
              <PersonIcon />
            </span>
          )
        }
      />

      {/* Delete — only while the row is active, so it never eats space otherwise.
          onMouseDown + preventDefault fires before the input's blur. */}
      {active && (
        <span className="inline-flex items-center h-6 flex-shrink-0">
          <button
            onMouseDown={(e) => { e.preventDefault(); onDelete(task); }}
            className="inline-flex items-center text-stone-400 hover:text-danger-500 transition-colors cursor-pointer"
            title="Delete task"
          >
            <TrashIcon />
          </button>
        </span>
      )}
    </div>
  );
}
