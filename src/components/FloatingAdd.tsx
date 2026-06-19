"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Person } from "@/lib/types";
import { dueLabel } from "@/lib/util";
import ProjectPicker from "./ProjectPicker";
import DatePicker from "./DatePicker";
import AssigneePicker from "./AssigneePicker";
import Avatar from "./Avatar";
import { CalendarIcon, PersonIcon, PlusIcon } from "./icons";

const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-700",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-accent-50 text-accent-700",
  none: "bg-info-50 text-info-700",
};

// Always-visible add button (circle on mobile, "+ Add task" pill on desktop)
// that opens a panel. A project is required; date/assignee are optional.
export default function FloatingAdd({
  projects,
  people,
  currentPersonId,
  onAdd,
}: {
  projects: { id: number; name: string }[];
  people: Person[];
  currentPersonId: number | null;
  onAdd: (
    projectId: number,
    input: { title: string; due_date: string | null; assignee_id: number | null }
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<number | null>(
    projects.length === 1 ? projects[0].id : null
  );
  const [due, setDue] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  // Nothing to file into → no point showing the button.
  if (projects.length === 0) return null;

  function reset() {
    setTitle("");
    setProjectId(projects.length === 1 ? projects[0].id : null);
    setDue(null);
    setAssigneeId(null);
    setOpen(false);
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed || projectId == null) return;
    onAdd(projectId, { title: trimmed, due_date: due, assignee_id: assigneeId });
    reset();
  }

  const due_ = dueLabel(due);
  const assignee = people.find((p) => p.id === assigneeId) ?? null;

  return (
    <>
      {/* Fixed full-width strip that mirrors <main>'s centered width, so the
          button right-aligns with the page content (header) instead of the
          browser edge. pointer-events disabled on the strip, enabled on the
          button, so it doesn't block clicks on what's behind it. */}
      <div className="fixed inset-x-0 bottom-5 sm:bottom-8 z-40 pointer-events-none">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex justify-end">
          <button
            onClick={() => setOpen(true)}
            aria-label="Add task"
            className="pointer-events-auto inline-flex items-center justify-center gap-1.5 bg-accent-500 text-white shadow-[0_6px_20px_-4px_rgba(80,60,30,0.45)] hover:bg-accent-600 transition-colors w-14 h-14 rounded-full sm:w-auto sm:h-auto sm:px-5 sm:py-3 sm:text-[15px] sm:font-semibold"
          >
            <PlusIcon className="w-7 h-7 sm:hidden" />
            <span className="hidden sm:inline">+ Add task</span>
          </button>
        </div>
      </div>

      {open && createPortal(
        <div
          data-overlay
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={reset}
        >
          {/* Blur lives on its own layer, not the positioned root: an element
              that is both `position: fixed` and `backdrop-filter` is mispositioned
              by iOS Safari (anchors to the document, not the viewport). */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" aria-hidden />
          <div className="relative min-h-full flex items-start justify-center p-4 pt-6 sm:pt-16">
          <div
            className="bg-paper rounded-2xl shadow-xl border border-line p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-[22px] font-semibold text-ink mb-4">Add task</h2>

            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") reset();
              }}
              placeholder="Task title…"
              className="w-full rounded-lg px-3 py-2 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
            />

            <div className="flex items-center gap-3 mt-3">
              <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} />

              <DatePicker
                value={due}
                onChange={setDue}
                trigger={
                  due ? (
                    <span className={`text-[12px] font-medium rounded-full px-2 py-0.5 ${TONE_BADGE[due_.tone]}`} title="Due date">
                      {due_.text}
                    </span>
                  ) : (
                    <span className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-500 transition-colors" title="Set a due date">
                      <CalendarIcon />
                    </span>
                  )
                }
              />

              <AssigneePicker
                people={people}
                assigneeId={assigneeId}
                currentPersonId={currentPersonId}
                onAssign={setAssigneeId}
                trigger={
                  assignee ? (
                    <Avatar person={assignee} size={24} />
                  ) : (
                    <span className="w-6 h-6 text-stone-400 flex items-center justify-center hover:text-accent-400 transition-colors" title="Assign someone">
                      <PersonIcon />
                    </span>
                  )
                }
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={reset}
                className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!title.trim() || projectId == null}
                title={projectId == null ? "Choose a project first" : undefined}
                className="flex-1 px-3 py-2 text-[15px] font-semibold rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:bg-accent-500"
              >
                Add
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
