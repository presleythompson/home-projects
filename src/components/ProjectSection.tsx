"use client";

import { useState } from "react";
import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import { compareByDue, compareByCompleted, isStaleCompleted } from "@/lib/util";
import EditableText from "./EditableText";
import ProgressBar from "./ProgressBar";
import TaskRow from "./TaskRow";
import SortableTaskList from "./SortableTaskList";
import AddTaskForm from "./AddTaskForm";
import { TrashIcon, ChevronUpIcon, ChevronDownIcon } from "./icons";

export default function ProjectSection({
  project,
  people,
  currentPersonId,
  projects,
  expandedTaskId,
  onExpand,
  onRenameProject,
  onDeleteProject,
  onSetOngoing,
  onAddTask,
  taskHandlers,
  onReorderTasks,
  onMoveProject,
  isFirst,
  isLast,
}: {
  project: ProjectWithTasks;
  people: Person[];
  currentPersonId: number | null;
  projects: { id: number; name: string }[];
  expandedTaskId: number | null;
  onExpand: (id: number | null) => void;
  onRenameProject: (id: number, name: string) => void;
  onDeleteProject: (project: ProjectWithTasks) => void;
  onSetOngoing: (id: number, isOngoing: boolean) => void;
  onAddTask: (projectId: number, input: { title: string; due_date: string | null; assignee_id: number | null }) => void;
  taskHandlers: {
    onToggle: (task: Task) => void;
    onRename: (id: number, title: string) => void;
    onAssign: (id: number, personId: number | null) => void;
    onSetDue: (id: number, due: string | null) => void;
    onChangeProject: (id: number, projectId: number) => void;
    onSetNotes: (id: number, notes: string) => void;
    onDelete: (task: Task) => void;
  };
  onReorderTasks: (ids: number[]) => void;
  onMoveProject: (id: number, dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editingName, setEditingName] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const total = project.tasks.length;
  const doneCount = project.tasks.filter((t) => t.is_done).length;
  const showBar = !project.is_ongoing && total > 0;

  const sortedTasks = [...project.tasks].sort((a, b) => {
    // Completed tasks sink to the bottom (most recently done first there).
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    if (a.is_done && b.is_done) return compareByCompleted(a, b);
    return compareByDue(a, b);
  });

  // Hide completions older than a day unless the user expands them.
  const hiddenCount = sortedTasks.filter(isStaleCompleted).length;
  // Open tasks are draggable (sorted by due date); completed ones render static
  // below (ordered by completion, not reorderable).
  const openTasks = sortedTasks.filter((t) => !t.is_done);
  const completedVisible = sortedTasks.filter(
    (t) => t.is_done && (showCompleted || !isStaleCompleted(t))
  );

  return (
    <section className="border-b-2 border-[#d8c7a0] pb-5 sm:pb-0 sm:bg-paper sm:rounded-2xl sm:shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] sm:border sm:border-line">
      <header data-edit-group className="px-0 py-3 border-b border-line/70 sm:px-6 sm:py-4">
        <div className="flex items-start gap-2.5">
          {/* Reorder: up/down by one slot, shown while editing the name.
              onMouseDown + preventDefault keeps the name input from blurring,
              so you can move repeatedly without re-opening edit. */}
          {editingName && (
            <div className="flex items-center flex-shrink-0 -ml-1">
              <button
                onMouseDown={(e) => { e.preventDefault(); if (!isFirst) onMoveProject(project.id, -1); }}
                disabled={isFirst}
                className="text-stone-400 hover:text-accent-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title="Move project up"
                aria-label="Move project up"
              >
                <ChevronUpIcon className="w-[18px] h-[18px]" />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); if (!isLast) onMoveProject(project.id, 1); }}
                disabled={isLast}
                className="text-stone-400 hover:text-accent-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                title="Move project down"
                aria-label="Move project down"
              >
                <ChevronDownIcon className="w-[18px] h-[18px]" />
              </button>
            </div>
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
          {/* Progress, right-anchored: a compact bar on mobile (≈1/4 width),
              a slightly wider slot on desktop. Finite projects only. */}
          {showBar && !editingName && (
            <div className="w-1/4 sm:w-32 flex-shrink-0">
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
      </header>

      <div className="px-0 py-2 sm:px-6 sm:py-3">
        {project.tasks.length === 0 ? (
          <p className="text-[14px] text-muted italic py-1">No tasks yet.</p>
        ) : (
          <>
            {openTasks.length > 0 && (
              <SortableTaskList
                tasks={openTasks}
                people={people}
                currentPersonId={currentPersonId}
                projects={projects}
                expandedTaskId={expandedTaskId}
                onExpand={onExpand}
                taskHandlers={taskHandlers}
                onReorder={onReorderTasks}
              />
            )}
            {completedVisible.length > 0 && (
              <div className="divide-y divide-line/60">
                {completedVisible.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    people={people}
                    currentPersonId={currentPersonId}
                    projects={projects}
                    expanded={task.id === expandedTaskId}
                    onExpand={onExpand}
                    {...taskHandlers}
                  />
                ))}
              </div>
            )}
          </>
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
