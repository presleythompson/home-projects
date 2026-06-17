"use client";

import { useState, useRef, useEffect } from "react";

export default function EditableText({
  value,
  onSave,
  className = "",
  onEditingChange,
}: {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Let the parent know (e.g. to reveal a delete control while editing).
  useEffect(() => {
    onEditingChange?.(editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => { setText(value); }, [value]);

  function handleSave() {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setText(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") { setText(value); setEditing(false); }
        }}
        className={`w-full min-w-0 box-border border border-accent-400 rounded px-1.5 py-0.5 outline-none bg-accent-50 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors hover:bg-accent-50 ${className}`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}
