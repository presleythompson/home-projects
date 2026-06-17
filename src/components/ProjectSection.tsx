"use client";

import { useState, type HTMLAttributes } from "react";
import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import EditableText from "./EditableText";
import ProgressBar from "./ProgressBar";
import TaskRow from "./TaskRow";
import AddTaskForm from "./AddTaskForm";
import { GripIcon, TrashIcon } from "./icons";

export default function ProjectSection({
  project,
  people,
  currentPersonId,
  onRenameProject,
  onDeleteProject,
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
  const total = project.tasks.length;
  const doneCount = project.tasks.filter((t) => t.is_done).length;

  // Completed one-time tasks sink to the bottom (most recently done first there).
  const sortedTasks = [...project.tasks].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    if (a.is_done && b.is_done) {
      return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
    }
    return a.sort_order - b.sort_order;
  });

  return (
    <section className="border-b border-line pb-4 sm:pb-0 sm:bg-paper sm:rounded-2xl sm:shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] sm:border sm:border-line">
      <header className="flex items-center gap-2.5 px-0 py-3 border-b border-line/70 sm:px-6 sm:py-4">
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
        <div className="flex items-center gap-3 flex-shrink-0">
          {total > 0 && <ProgressBar completed={doneCount} total={total} />}
          {editingName && (
            <button
              onMouseDown={(e) => { e.preventDefault(); onDeleteProject(project); }}
              className="inline-flex items-center text-stone-400 hover:text-danger-500 transition-colors cursor-pointer"
              title="Delete project"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </header>

      <div className="px-0 py-2 sm:px-6 sm:py-3">
        {project.tasks.length === 0 ? (
          <p className="text-[14px] text-muted italic py-1">No tasks yet.</p>
        ) : (
          <div className="divide-y divide-line/60">
            {sortedTasks.map((task) => (
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
