"use client";

import { useState, useRef, useEffect } from "react";
import type { Person } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import DatePicker from "./DatePicker";
import AssigneePicker from "./AssigneePicker";
import { CalendarIcon, PersonIcon } from "./icons";

const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-600",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-line/70 text-stone-600",
  none: "bg-line/70 text-stone-500",
};

export default function AddTaskForm({
  people,
  currentPersonId,
  onAdd,
}: {
  people: Person[];
  currentPersonId: number | null;
  onAdd: (input: { title: string; due_date: string | null; assignee_id: number | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) { reset(); return; }
    onAdd({ title: trimmed, due_date: due, assignee_id: assigneeId });
    reset();
  }

  function reset() {
    setTitle("");
    setDue(null);
    setAssigneeId(null);
    setOpen(false);
  }

  // Clicking/tapping outside cancels (so no explicit Cancel button needed).
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) reset();
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[14px] text-muted hover:text-accent-600 transition-colors py-1 cursor-pointer"
      >
        + Add task
      </button>
    );
  }

  const due_ = dueLabel(due);
  const assignee = people.find((p) => p.id === assigneeId) ?? null;

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2 py-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") reset();
        }}
        placeholder="Task title…"
        className="flex-1 min-w-[160px] rounded-lg px-3 py-1.5 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
      />

      {/* Due date */}
      <DatePicker
        value={due}
        onChange={setDue}
        trigger={
          due ? (
            <span className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_BADGE[due_.tone]}`} title="Due date">
              {due_.text}
            </span>
          ) : (
            <span className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-500 transition-colors" title="Set a due date">
              <CalendarIcon />
            </span>
          )
        }
      />

      {/* Assignee */}
      <AssigneePicker
        people={people}
        assigneeId={assigneeId}
        currentPersonId={currentPersonId}
        onAssign={setAssigneeId}
        trigger={
          assignee ? (
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ring-1 ring-black/5"
              style={{ background: assignee.color }}
              title={`Assigned to ${assignee.name}`}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-400 transition-colors" title="Assign someone">
              <PersonIcon />
            </span>
          )
        }
      />

      <button
        onClick={submit}
        className="rounded-lg px-3 py-1.5 text-[14px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors cursor-pointer"
      >
        Add
      </button>
    </div>
  );
}
