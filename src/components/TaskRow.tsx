"use client";

import { useState } from "react";
import type { Person, Task } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import EditableText from "./EditableText";
import AssigneePicker from "./AssigneePicker";
import DatePicker from "./DatePicker";
import Avatar from "./Avatar";
import { CalendarIcon, PersonIcon, TrashIcon } from "./icons";

const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-600",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-line/70 text-stone-600",
  none: "bg-line/70 text-stone-500",
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
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const due = dueLabel(task.due_date);
  const assignee = people.find((p) => p.id === task.assignee_id) ?? null;

  return (
    // items-start + a fixed 24px line height (leading-6) so every control aligns
    // to the FIRST line of the title, even when the title wraps. Each control
    // sits in a matching h-6 centered box so set/unset states line up.
    <div className="group flex items-start gap-2.5 py-2.5">
      <span className="flex items-center h-6 flex-shrink-0">
        <input type="checkbox" checked={task.is_done} onChange={() => onToggle(task)} />
      </span>

      {/* Title — click to edit in place */}
      <span className={`flex-1 min-w-0 text-[16px] leading-6 ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
        <EditableText value={task.title} onSave={(v) => onRename(task.id, v)} onEditingChange={setEditingTitle} />
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

      {/* Delete — only while editing the title, so it never eats space otherwise.
          onMouseDown + preventDefault fires before the input's blur unmounts it. */}
      {editingTitle && (
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
