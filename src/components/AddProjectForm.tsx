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
      <div className="flex items-center gap-2.5 pl-0.5">
        <span className="text-[13px] text-muted">Type</span>
        <div className="inline-flex rounded-lg border border-stone-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsOngoing(false)}
            className={`px-3 py-1.5 text-[13px] font-medium transition-colors ${
              !isOngoing ? "bg-accent-500 text-white" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Finite
          </button>
          <button
            type="button"
            onClick={() => setIsOngoing(true)}
            className={`px-3 py-1.5 text-[13px] font-medium border-l border-stone-200 transition-colors ${
              isOngoing ? "bg-accent-500 text-white" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Ongoing
          </button>
        </div>
      </div>
    </div>
  );
}
