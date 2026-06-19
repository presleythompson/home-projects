"use client";

import { useState, useRef } from "react";
import type { Person } from "@/lib/types";
import { useOutsideDismiss } from "@/lib/useOutsideDismiss";
import { dueLabel } from "@/lib/util";
import DatePicker from "./DatePicker";
import AssigneePicker from "./AssigneePicker";
import ProjectPicker from "./ProjectPicker";
import { PopoverGroup } from "./Popover";
import Avatar from "./Avatar";
import { CalendarIcon, PersonIcon } from "./icons";

const TONE_BADGE: Record<string, string> = {
  overdue: "bg-danger-50 text-danger-600",
  today: "bg-accent-100 text-accent-700",
  soon: "bg-line/70 text-stone-600",
  none: "bg-line/70 text-stone-500",
};

export default function AddTaskForm({
  people,
  currentPersonId,
  onAdd,
  defaultAssigneeId = null,
  projects,
  showAssignee = true,
}: {
  people: Person[];
  currentPersonId: number | null;
  onAdd: (input: {
    title: string;
    due_date: string | null;
    assignee_id: number | null;
    project_id?: number | null;
  }) => void;
  // Pre-fill the assignee (e.g. the person whose section you're adding under).
  defaultAssigneeId?: number | null;
  // When provided, a project picker is shown (used in the by-person view, where
  // there's no implied project). Omitted in the project view.
  projects?: { id: number; name: string }[];
  // The by-person view hides the assignee picker — the task is always assigned
  // to the section it's added from (defaultAssigneeId).
  showAssignee?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(defaultAssigneeId);
  // A project is required when the picker is shown (by-person view). Pre-select
  // it if there's only one project; otherwise the user must choose.
  const initialProjectId = projects && projects.length === 1 ? projects[0].id : null;
  const [projectId, setProjectId] = useState<number | null>(initialProjectId);
  const ref = useRef<HTMLDivElement>(null);

  // When the picker is shown, a project must be chosen before adding.
  const projectMissing = !!projects && projectId == null;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) { reset(); return; }
    if (projectMissing) return; // keep the form open until a project is picked
    onAdd({
      title: trimmed,
      due_date: due,
      assignee_id: assigneeId,
      ...(projects ? { project_id: projectId } : {}),
    });
    reset();
  }

  function reset() {
    setTitle("");
    setDue(null);
    setAssigneeId(defaultAssigneeId);
    setProjectId(initialProjectId);
    setOpen(false);
  }

  // Clicking/tapping outside cancels (so no explicit Cancel button needed),
  // and that tap is swallowed so it doesn't activate something else.
  useOutsideDismiss(open, ref, reset);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[14px] text-muted hover:text-accent-600 transition-colors py-1 cursor-pointer"
      >
        + Add task
      </button>
    );
  }

  const due_ = dueLabel(due);
  const assignee = people.find((p) => p.id === assigneeId) ?? null;

  return (
    <PopoverGroup>
    <div ref={ref} className="flex flex-wrap items-center gap-2 py-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") reset();
        }}
        placeholder="Task title…"
        className="flex-1 min-w-[160px] rounded-lg px-3 py-1.5 text-[15px] border border-stone-200 outline-none focus:border-accent-400 bg-paper"
      />

      {/* Project (by-person view only) */}
      {projects && (
        <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} />
      )}

      {/* Due date */}
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

      {/* Assignee — hidden in the by-person view (always assigned to the section) */}
      {showAssignee && (
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
      )}

      <button
        onClick={submit}
        disabled={projectMissing}
        title={projectMissing ? "Choose a project first" : undefined}
        className="rounded-lg px-3 py-1.5 text-[14px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:bg-accent-500"
      >
        Add
      </button>
    </div>
    </PopoverGroup>
  );
}
