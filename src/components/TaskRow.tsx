"use client";

import { useRef } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Person, Task } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import { useOutsideDismiss } from "@/lib/useOutsideDismiss";
import EditableText from "./EditableText";
import ProjectPicker from "./ProjectPicker";
import AssigneePicker from "./AssigneePicker";
import DatePicker from "./DatePicker";
import { PopoverGroup } from "./Popover";
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
  projects,
  expanded,
  onExpand,
  onToggle,
  onRename,
  onAssign,
  onSetDue,
  onChangeProject,
  onSetNotes,
  onDelete,
  projectLabel,
  dragAttributes,
  dragListeners,
  setActivatorNodeRef,
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  projects: { id: number; name: string }[];
  // "expanded" = Things-style edit mode, controlled by TaskApp's expandedTaskId
  // so only one row is open at a time across every list.
  expanded: boolean;
  onExpand: (id: number | null) => void;
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onChangeProject: (id: number, projectId: number) => void;
  onSetNotes: (id: number, notes: string) => void;
  onDelete: (task: Task) => void;
  projectLabel?: string;
  // Provided by SortableTaskList: the drag activator goes on the grip shown in
  // the expanded card. Absent for non-sortable rows (completed / Unfiled).
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  // Tapping outside an open row collapses it. Pickers render absolutely inside
  // the row's [data-edit-group], so opening one doesn't count as "outside".
  useOutsideDismiss(expanded, rowRef, () => onExpand(null));

  const due = dueLabel(task.due_date);
  const assignee = people.find((p) => p.id === task.assignee_id) ?? null;
  const showGrip = expanded && !!dragListeners;

  // --- Collapsed: a compact strip. Tap anywhere (but the checkbox) to expand.
  if (!expanded) {
    return (
      <div ref={rowRef} data-edit-group className="group flex items-center gap-2.5 py-2.5">
        <span className="flex items-center h-6 flex-shrink-0">
          <input
            type="checkbox"
            checked={task.is_done}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggle(task)}
          />
        </span>

        <button
          type="button"
          onClick={() => onExpand(task.id)}
          className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
        >
          <span className="flex-1 min-w-0 truncate">
            <span className={`text-[16px] leading-6 ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
              {task.title}
            </span>
            {projectLabel && (
              <span className="ml-2 text-[12px] text-muted">{projectLabel}</span>
            )}
          </span>

          {/* Read-only at-a-glance metadata (display only — tapping expands). */}
          {task.due_date && (
            <span className={`flex-shrink-0 text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_BADGE[due.tone]}`}>
              {due.text}
            </span>
          )}
          {assignee && <Avatar person={assignee} size={24} className="flex-shrink-0" />}
        </button>
      </div>
    );
  }

  // --- Expanded: an inline edit card that grows in place. White on mobile (no
  // grouping cards there) for contrast; blends into the grouping card on desktop.
  // The grip replaces the checkbox on the left; no checkbox in edit mode.
  return (
    <div
      ref={rowRef}
      data-edit-group
      className="rounded-xl bg-paper shadow-[0_4px_16px_-8px_rgba(80,60,30,0.25)] ring-1 ring-accent-100 sm:bg-accent-50/40 sm:shadow-none px-3 py-3 my-1"
    >
      <div className="flex items-start gap-2.5">
        {showGrip && (
          <button
            ref={setActivatorNodeRef}
            {...dragAttributes}
            {...dragListeners}
            className="flex items-center h-6 text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            title="Drag to reorder"
            aria-label="Drag to reorder task"
          >
            <GripIcon className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Content column — title, notes and controls all share this left edge. */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2.5">
            <span className={`flex-1 min-w-0 text-[16px] leading-6 ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
              <EditableText
                value={task.title}
                onSave={(v) => onRename(task.id, v)}
                className="block"
              />
            </span>

            <button
              onMouseDown={(e) => { e.preventDefault(); onDelete(task); }}
              className="inline-flex items-center h-6 text-stone-400 hover:text-danger-500 transition-colors cursor-pointer flex-shrink-0"
              title="Delete task"
            >
              <TrashIcon />
            </button>
          </div>

          {/* Notes — tap to edit (multi-line). */}
          <div className="mt-1.5 text-[14px] text-stone-600">
            <EditableText
              multiline
              placeholder="Notes…"
              value={task.notes ?? ""}
              onSave={(v) => onSetNotes(task.id, v)}
              className="block w-full"
            />
          </div>

          {/* Control row — change project / date / person (each opens on its own tap). */}
          <PopoverGroup>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <ProjectPicker
              projects={projects}
              value={task.project_id}
              onChange={(pid) => onChangeProject(task.id, pid)}
            />

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
          </div>
          </PopoverGroup>
        </div>
      </div>
    </div>
  );
}
