"use client";

import { useState } from "react";
import type { Person } from "@/lib/types";
import { PERSON_COLORS } from "@/lib/colors";
import Avatar from "./Avatar";
import AvatarEditor from "./AvatarEditor";

// Shown when no one is identified yet, so actions are never anonymous.
// Pick an existing person or add yourself. No dismiss — a choice is required.
export default function NamePrompt({
  people,
  onPick,
  onAdd,
}: {
  people: Person[];
  onPick: (id: number) => void;
  onAdd: (name: string, color: string, avatar: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PERSON_COLORS[people.length % PERSON_COLORS.length]);
  const [avatar, setAvatar] = useState<string | null>(null);

  function add() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed, color, avatar);
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
              <Avatar person={p} size={28} />
              <span className="text-[16px] font-medium text-ink">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-line mt-5 pt-4 space-y-3.5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-stone-400">Or add yourself</p>

          {/* Live preview + name */}
          <div className="flex items-center gap-2.5">
            <Avatar person={{ name: name.trim() || "?", color, avatar }} size={40} />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder="Your name"
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
            />
          </div>

          <AvatarEditor color={color} avatar={avatar} onColor={setColor} onAvatar={setAvatar} />

          <button
            onClick={add}
            disabled={!name.trim()}
            className="w-full rounded-lg px-4 py-2.5 text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
