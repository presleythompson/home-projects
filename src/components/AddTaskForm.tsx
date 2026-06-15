"use client";

import { useState, useRef, useEffect } from "react";
import { dueLabel } from "@/lib/util";
import DatePicker from "./DatePicker";

export default function AddTaskForm({
  onAdd,
}: {
  onAdd: (input: { title: string; due_date: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) { reset(); return; }
    onAdd({ title: trimmed, due_date: due });
    reset();
  }

  function reset() {
    setTitle("");
    setDue(null);
    setOpen(false);
  }

  // Cancel when clicking outside the open form.
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
        className="text-[14px] text-muted hover:text-accent-600 transition-colors py-1"
      >
        + Add task
      </button>
    );
  }

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
        className="flex-1 min-w-[180px] rounded-lg px-3 py-1.5 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
      />
      <DatePicker
        value={due}
        onChange={setDue}
        trigger={
          <span
            className={`text-[14px] rounded-lg px-2.5 py-1.5 border transition-colors ${
              due
                ? "border-accent-200 bg-accent-50 text-accent-700 font-medium"
                : "border-stone-200 text-stone-500 hover:border-accent-400"
            }`}
            title="Set a due date"
          >
            {due ? dueLabel(due).text : "📅 Date"}
          </span>
        }
      />
      <button
        onClick={submit}
        className="rounded-lg px-3 py-1.5 text-[14px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors"
      >
        Add
      </button>
      <button
        onClick={reset}
        className="rounded-lg px-2 py-1.5 text-[14px] text-muted hover:text-stone-600"
      >
        Cancel
      </button>
    </div>
  );
}
