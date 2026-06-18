"use client";

import { useState } from "react";
import type { Person } from "@/lib/types";
import { PERSON_COLORS } from "@/lib/colors";
import Avatar from "./Avatar";
import AvatarEditor from "./AvatarEditor";

// Shown when no one is identified yet, so actions are never anonymous. Two
// steps so the screen isn't overwhelming: first pick an existing name or choose
// to add; only then (step 2) set a color/emoji. No dismiss — a choice is required.
export default function NamePrompt({
  people,
  onPick,
  onAdd,
}: {
  people: Person[];
  onPick: (id: number) => void;
  onAdd: (name: string, color: string, avatar: string | null) => void;
}) {
  const [step, setStep] = useState<"choose" | "add">(people.length ? "choose" : "add");
  const [name, setName] = useState("");
  const [color, setColor] = useState(PERSON_COLORS[people.length % PERSON_COLORS.length]);
  const [avatar, setAvatar] = useState<string | null>(null);

  function add() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed, color, avatar);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-6 sm:pt-10">
      <div className="bg-paper rounded-2xl shadow-xl border border-line p-6 w-full max-w-sm">
        {step === "choose" ? (
          <>
            <h2 className="font-display text-[24px] font-semibold text-ink mb-5">Who are you?</h2>

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

              <button
                onClick={() => setStep("add")}
                className="w-full flex items-center gap-3 rounded-xl border border-dashed border-stone-300 px-3 py-2.5 text-stone-500 hover:border-accent-400 hover:text-accent-600 transition-colors cursor-pointer text-left"
              >
                <span className="w-7 h-7 rounded-full border border-dashed border-current flex items-center justify-center text-[18px] leading-none flex-shrink-0">+</span>
                <span className="text-[16px] font-medium">Add someone new</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              {people.length > 0 && (
                <button
                  onClick={() => setStep("choose")}
                  className="text-stone-400 hover:text-ink transition-colors cursor-pointer text-[20px] leading-none -ml-1"
                  aria-label="Back"
                  title="Back"
                >
                  ‹
                </button>
              )}
              <h2 className="font-display text-[24px] font-semibold text-ink">Add yourself</h2>
            </div>

            <div className="space-y-3.5">
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
          </>
        )}
      </div>
    </div>
  );
}
