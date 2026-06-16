"use client";

import { useState } from "react";
import type { Person } from "@/lib/types";
import { PERSON_COLORS } from "@/lib/colors";

// Shown when no one is identified yet, so actions are never anonymous.
// Pick an existing person or add yourself. No dismiss — a choice is required.
export default function NamePrompt({
  people,
  onPick,
  onAdd,
}: {
  people: Person[];
  onPick: (id: number) => void;
  onAdd: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PERSON_COLORS[people.length % PERSON_COLORS.length]);

  function add() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed, color);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper rounded-2xl shadow-xl border border-line p-6 w-full max-w-sm">
        <h2 className="font-display text-[24px] font-semibold text-ink mb-5">Select or add your name!</h2>

        <div className="space-y-2">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="w-full flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent-400 hover:bg-accent-50 transition-colors cursor-pointer text-left"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                style={{ background: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-[16px] font-medium text-ink">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-line mt-5 pt-4">
          <div className="flex items-center gap-2">
            <label
              className="relative w-9 h-9 rounded-full cursor-pointer ring-1 ring-black/10 hover:ring-2 hover:ring-stone-300 transition-all flex-shrink-0"
              style={{ background: color }}
              title="Pick a color"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder="Add your name…"
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
            />
            <button
              onClick={add}
              className="rounded-lg px-4 py-2 text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors cursor-pointer flex-shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
