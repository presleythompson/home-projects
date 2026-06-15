"use client";

import { useState } from "react";
import type { Person } from "@/lib/types";

export default function PersonSwitcher({
  people,
  currentPersonId,
  onPick,
  onAdd,
}: {
  people: Person[];
  currentPersonId: number | null;
  onPick: (id: number) => void;
  onAdd: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName("");
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-medium text-muted mr-1">Who&apos;s using this?</span>

      {people.map((p) => {
        const active = p.id === currentPersonId;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 text-[14px] font-medium transition-all ${
              active
                ? "bg-white shadow-sm ring-2"
                : "bg-white/60 hover:bg-white text-slate-600"
            }`}
            style={active ? { ["--tw-ring-color" as string]: p.color, color: p.color } : undefined}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: p.color }}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
            {p.name}
          </button>
        );
      })}

      {adding ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") { setName(""); setAdding(false); }
          }}
          placeholder="Name…"
          className="rounded-full px-3 py-1 text-[14px] border border-accent-400 bg-accent-50 outline-none w-28"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full px-2.5 py-1 text-[14px] text-muted hover:text-accent-600 hover:bg-white transition-colors"
          title="Add a person"
        >
          + person
        </button>
      )}
    </div>
  );
}
