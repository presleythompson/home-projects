"use client";

import { useState } from "react";

export default function AddProjectForm({
  onAdd,
}: {
  onAdd: (name: string, isOngoing: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);

  function reset() {
    setName("");
    setIsOngoing(false);
    setOpen(false);
  }

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed, isOngoing);
    reset();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-2 text-[15px] font-semibold text-accent-600 border border-dashed border-accent-200 hover:bg-accent-50 transition-colors"
      >
        + New project
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") reset();
          }}
          placeholder="Project name…"
          className="rounded-lg px-3 py-2 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper w-56"
        />
        <button
          onClick={submit}
          className="rounded-lg px-3 py-2 text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors"
        >
          Add
        </button>
        <button
          onClick={reset}
          className="rounded-lg px-2 py-2 text-[15px] text-muted hover:text-stone-600"
        >
          Cancel
        </button>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-muted cursor-pointer select-none pl-0.5">
        <input
          type="checkbox"
          checked={isOngoing}
          onChange={(e) => setIsOngoing(e.target.checked)}
        />
        Ongoing — no progress bar
      </label>
    </div>
  );
}
