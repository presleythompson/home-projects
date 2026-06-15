"use client";

import type { Person, Task } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import EditableText from "./EditableText";
import AssigneePicker from "./AssigneePicker";
import DatePicker from "./DatePicker";

const TONE_CLASS: Record<string, string> = {
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
  const due = dueLabel(task.due_date);

  return (
    <div className="group flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg hover:bg-accent-50/70 transition-colors">
      <input
        type="checkbox"
        checked={task.is_done}
        onChange={() => onToggle(task)}
      />

      <span className={`flex-1 text-[16px] ${task.is_done ? "line-through text-stone-400" : "text-ink"}`}>
        <EditableText value={task.title} onSave={(v) => onRename(task.id, v)} />
      </span>

      {/* Due date — click to pick */}
      <DatePicker
        value={task.due_date}
        onChange={(d) => onSetDue(task.id, d)}
        trigger={
          task.due_date ? (
            <span className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_CLASS[due.tone]}`} title="Change due date">
              {due.text}
            </span>
          ) : (
            <span className="text-[12px] text-stone-400 opacity-0 group-hover:opacity-100 hover:text-accent-500 transition-colors" title="Add a due date">
              + date
            </span>
          )
        }
      />

      <AssigneePicker
        people={people}
        assigneeId={task.assignee_id}
        currentPersonId={currentPersonId}
        onAssign={(pid) => onAssign(task.id, pid)}
      />

      <button
        onClick={() => onDelete(task)}
        className="text-stone-300 opacity-0 group-hover:opacity-100 hover:text-danger-500 transition-all text-[18px] leading-none px-1"
        title="Delete task"
      >
        ×
      </button>
    </div>
  );
}
