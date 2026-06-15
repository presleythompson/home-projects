"use client";

import { useState } from "react";
import type { Recurrence } from "@/lib/types";

export default function AddTaskForm({
  onAdd,
}: {
  onAdd: (input: { title: string; due_date: string | null; recurrence: Recurrence }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) { reset(); return; }
    onAdd({ title: trimmed, due_date: due || null, recurrence });
    reset();
  }

  function reset() {
    setTitle("");
    setDue("");
    setRecurrence(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[14px] text-muted hover:text-accent-600 transition-colors py-1"
      >
        + Add task
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") reset();
        }}
        placeholder="Task title…"
        className="flex-1 min-w-[180px] rounded-lg px-3 py-1.5 text-[15px] border border-slate-200 outline-none focus:border-accent-400 bg-white"
      />
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
        className="rounded-lg px-2 py-1.5 text-[14px] border border-slate-200 outline-none focus:border-accent-400 bg-white text-slate-600"
      />
      <select
        value={recurrence ?? ""}
        onChange={(e) => setRecurrence((e.target.value || null) as Recurrence)}
        className="rounded-lg px-2 py-1.5 text-[14px] border border-slate-200 outline-none focus:border-accent-400 bg-white text-slate-600"
      >
        <option value="">One-time</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button
        onClick={submit}
        className="rounded-lg px-3 py-1.5 text-[14px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors"
      >
        Add
      </button>
      <button
        onClick={reset}
        className="rounded-lg px-2 py-1.5 text-[14px] text-muted hover:text-slate-600"
      >
        Cancel
      </button>
    </div>
  );
}
