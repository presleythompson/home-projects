"use client";

import { useState, useRef, useEffect } from "react";
import { useOutsideDismiss } from "@/lib/useOutsideDismiss";

export default function EditableText({
  value,
  onSave,
  className = "",
  onEditingChange,
  multiline = false,
  placeholder,
}: {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  onEditingChange?: (editing: boolean) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      // Place the caret at the end rather than selecting all — friendlier on
      // touch, where select-all + retype is awkward.
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [editing]);

  // Let the parent know (e.g. to reveal a delete control while editing).
  useEffect(() => {
    onEditingChange?.(editing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useEffect(() => { setText(value); }, [value]);

  // Tapping outside saves and exits — and swallows that tap so it doesn't also
  // start editing whatever was under it.
  useOutsideDismiss(editing, inputRef, () => handleSave());

  function handleSave() {
    const trimmed = text.trim();
    // Single-line: only save non-empty changes. Multiline (notes): allow saving
    // an empty value so notes can be cleared.
    if (multiline ? trimmed !== value : (trimmed && trimmed !== value)) onSave(trimmed);
    else setText(value);
    setEditing(false);
  }

  if (editing) {
    const editClass = `w-full min-w-0 box-border border border-accent-400 rounded px-1.5 py-0.5 outline-none bg-accent-50 ${className}`;
    const onKeyDown = (e: React.KeyboardEvent) => {
      // In multiline mode Enter inserts a newline; only single-line saves on Enter.
      if (e.key === "Enter" && !multiline) handleSave();
      if (e.key === "Escape") { setText(value); setEditing(false); }
    };
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={text}
        rows={2}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={onKeyDown}
        className={`${editClass} resize-y`}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={onKeyDown}
        className={editClass}
      />
    );
  }

  const isEmpty = value.length === 0;
  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className={`cursor-pointer rounded px-0.5 -mx-0.5 transition-colors hover:bg-accent-50 ${isEmpty ? "text-muted" : ""} ${className}`}
      title="Click to edit"
    >
      {isEmpty ? (placeholder ?? "") : value}
    </span>
  );
}
