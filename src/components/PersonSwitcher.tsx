"use client";

import { useState, useRef, useEffect } from "react";
import type { Person } from "@/lib/types";
import { PERSON_COLORS } from "@/lib/colors";

function Avatar({ person, size = 24 }: { person: Person; size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ background: person.color, width: size, height: size, fontSize: size * 0.45 }}
    >
      {person.name.charAt(0).toUpperCase()}
    </span>
  );
}

function ColorWell({ value, onSelect }: { value: string; onSelect: (c: string) => void }) {
  return (
    <label
      className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 cursor-pointer ring-1 ring-black/10 hover:ring-2 hover:ring-stone-300 transition-all"
      style={{ background: value }}
      title="Change color"
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  );
}

export default function PersonSwitcher({
  people,
  currentPersonId,
  onPick,
  onAdd,
  onUpdate,
  onRemove,
}: {
  people: Person[];
  currentPersonId: number | null;
  onPick: (id: number) => void;
  onAdd: (name: string, color: string) => void;
  onUpdate: (id: number, patch: { name?: string; color?: string }) => void;
  onRemove: (person: Person) => void;
}) {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PERSON_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);

  const current = people.find((p) => p.id === currentPersonId) ?? null;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setManaging(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(id: number) {
    onPick(id);
    setOpen(false);
  }

  function submitAdd() {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed, color);
    setName("");
    setColor(PERSON_COLORS[people.length % PERSON_COLORS.length]);
  }

  // A name is always chosen via the first-visit prompt, so there's no
  // "select your name" state here — just the current person's pill.
  if (!current) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-paper border border-line pl-1.5 pr-2.5 py-1.5 shadow-sm hover:border-stone-300 transition-colors cursor-pointer"
        title="Switch person"
      >
        <Avatar person={current} />
        <span className="text-[14px] font-semibold text-ink">{current.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-30 bg-paper rounded-xl shadow-lg border border-line w-64 text-[14px] overflow-hidden">
          {!managing ? (
            <div className="p-1.5">
              <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                I am…
              </p>
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-accent-50 transition-colors"
                >
                  <Avatar person={p} size={22} />
                  <span className={`flex-1 text-left ${p.id === currentPersonId ? "font-semibold text-ink" : "text-stone-600"}`}>
                    {p.name}
                  </span>
                  {p.id === currentPersonId && <span className="text-accent-600 text-[13px]">✓</span>}
                </button>
              ))}
              {people.length === 0 && (
                <p className="px-2.5 py-1.5 text-stone-400 italic">No people yet.</p>
              )}
              <div className="border-t border-line my-1.5" />
              <button
                onClick={() => setManaging(true)}
                className="w-full text-left rounded-lg px-2.5 py-1.5 text-stone-500 hover:bg-stone-50 transition-colors"
              >
                Manage people…
              </button>
            </div>
          ) : (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-stone-400">Manage people</h3>
                <button
                  onClick={() => setManaging(false)}
                  className="text-[13px] text-accent-600 font-medium hover:text-accent-700"
                >
                  Done
                </button>
              </div>

              <ul className="space-y-2.5 mb-3">
                {people.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <ColorWell value={p.color} onSelect={(c) => onUpdate(p.id, { color: c })} />
                    <input
                      defaultValue={p.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== p.name) onUpdate(p.id, { name: v });
                      }}
                      className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-[14px] border border-transparent hover:border-stone-200 focus:border-accent-400 outline-none"
                    />
                    <button
                      onClick={() => onRemove(p)}
                      className="text-stone-300 hover:text-danger-500 transition-colors text-[18px] leading-none px-1 flex-shrink-0"
                      title={`Remove ${p.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add a person */}
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <ColorWell value={color} onSelect={setColor} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAdd();
                  }}
                  placeholder="Add a person…"
                  className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-[14px] border border-stone-200 outline-none focus:border-accent-400"
                />
                <button
                  onClick={submitAdd}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
