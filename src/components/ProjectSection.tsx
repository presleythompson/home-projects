"use client";

import { useState, type HTMLAttributes } from "react";
import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import EditableText from "./EditableText";
import ProgressBar from "./ProgressBar";
import TaskRow from "./TaskRow";
import AddTaskForm from "./AddTaskForm";
import { GripIcon, TrashIcon } from "./icons";

// Completed tasks stay visible for 2 days, then hide (toggleable per project).
const STALE_MS = 2 * 24 * 60 * 60 * 1000;
function isStaleCompleted(t: Task): boolean {
  return t.is_done && !!t.completed_at && Date.now() - new Date(t.completed_at).getTime() > STALE_MS;
}

export default function ProjectSection({
  project,
  people,
  currentPersonId,
  onRenameProject,
  onDeleteProject,
  onSetOngoing,
  onAddTask,
  taskHandlers,
  dragHandleProps,
  setActivatorNodeRef,
}: {
  project: ProjectWithTasks;
  people: Person[];
  currentPersonId: number | null;
  onRenameProject: (id: number, name: string) => void;
  onDeleteProject: (project: ProjectWithTasks) => void;
  onSetOngoing: (id: number, isOngoing: boolean) => void;
  onAddTask: (projectId: number, input: { title: string; due_date: string | null; assignee_id: number | null }) => void;
  taskHandlers: {
    onToggle: (task: Task) => void;
    onRename: (id: number, title: string) => void;
    onAssign: (id: number, personId: number | null) => void;
    onSetDue: (id: number, due: string | null) => void;
    onDelete: (task: Task) => void;
  };
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const total = project.tasks.length;
  const doneCount = project.tasks.filter((t) => t.is_done).length;
  const showBar = !project.is_ongoing && total > 0;

  // Completed one-time tasks sink to the bottom (most recently done first there).
  const sortedTasks = [...project.tasks].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    if (a.is_done && b.is_done) {
      // completed_at may arrive as a Date (server) or string (optimistic update);
      // coerce both so the comparison is safe either way.
      return String(b.completed_at ?? "").localeCompare(String(a.completed_at ?? ""));
    }
    return a.sort_order - b.sort_order;
  });

  // Hide completions older than 2 days unless the user expands them.
  const hiddenCount = sortedTasks.filter(isStaleCompleted).length;
  const visibleTasks = showCompleted ? sortedTasks : sortedTasks.filter((t) => !isStaleCompleted(t));

  return (
    <section className="border-b border-line pb-4 sm:pb-0 sm:bg-paper sm:rounded-2xl sm:shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] sm:border sm:border-line">
      <header className="px-0 py-3 border-b border-line/70 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5">
          {dragHandleProps && (
            <button
              ref={setActivatorNodeRef}
              {...dragHandleProps}
              className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 -ml-1"
              title="Drag to reorder"
              aria-label="Drag to reorder project"
            >
              <GripIcon className="w-[18px] h-[18px]" />
            </button>
          )}
          <h2 className="flex-1 min-w-0 flex items-center">
            <span className="block w-full uppercase tracking-[0.12em] text-[15px] font-bold text-ink">
              <EditableText
                value={project.name}
                onSave={(v) => onRenameProject(project.id, v)}
                onEditingChange={setEditingName}
              />
            </span>
          </h2>
          {/* Desktop: progress in a compact inline slot (finite projects only). */}
          {showBar && !editingName && (
            <div className="hidden sm:block w-32 flex-shrink-0">
              <ProgressBar completed={doneCount} total={total} />
            </div>
          )}
          {editingName && (
            <>
              {/* Reclassify: finite (progress bar) ⇄ ongoing (no bar). */}
              <button
                onMouseDown={(e) => { e.preventDefault(); onSetOngoing(project.id, !project.is_ongoing); }}
                className={`text-[11px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                  project.is_ongoing ? "bg-accent-100 text-accent-700" : "bg-line/70 text-stone-500 hover:text-stone-700"
                }`}
                title={project.is_ongoing ? "Ongoing — no progress bar. Click to make finite." : "Finite — has a progress bar. Click to make ongoing."}
              >
                {project.is_ongoing ? "Ongoing" : "Finite"}
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); onDeleteProject(project); }}
                className="inline-flex items-center text-stone-400 hover:text-danger-500 transition-colors cursor-pointer flex-shrink-0"
                title="Delete project"
              >
                <TrashIcon />
              </button>
            </>
          )}
        </div>

        {/* Mobile: full-width progress below the title, stretching to the left
            margin (no title indent), count pinned to the right. */}
        {showBar && (
          <div className="sm:hidden mt-2.5">
            <ProgressBar completed={doneCount} total={total} />
          </div>
        )}
      </header>

      <div className="px-0 py-2 sm:px-6 sm:py-3">
        {project.tasks.length === 0 ? (
          <p className="text-[14px] text-muted italic py-1">No tasks yet.</p>
        ) : (
          <div className="divide-y divide-line/60">
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                people={people}
                currentPersonId={currentPersonId}
                {...taskHandlers}
              />
            ))}
          </div>
        )}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="mt-1.5 text-[12px] text-stone-400 hover:text-accent-600 transition-colors cursor-pointer"
          >
            {showCompleted ? "Hide completed" : `Show completed (${hiddenCount})`}
          </button>
        )}
        <div className="pt-1.5">
          <AddTaskForm
            people={people}
            currentPersonId={currentPersonId}
            onAdd={(input) => onAddTask(project.id, input)}
          />
        </div>
      </div>
    </section>
  );
}
