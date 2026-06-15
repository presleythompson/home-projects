"use client";

import { useState } from "react";

export default function AddProjectForm({
  onAdd,
}: {
  onAdd: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName("");
    setOpen(false);
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
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setName(""); setOpen(false); }
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
        onClick={() => { setName(""); setOpen(false); }}
        className="rounded-lg px-2 py-2 text-[15px] text-muted hover:text-stone-600"
      >
        Cancel
      </button>
    </div>
  );
}
