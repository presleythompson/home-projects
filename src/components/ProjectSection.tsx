"use client";

import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import EditableText from "./EditableText";
import ProgressBar from "./ProgressBar";
import TaskRow from "./TaskRow";
import AddTaskForm from "./AddTaskForm";

export default function ProjectSection({
  project,
  people,
  currentPersonId,
  onRenameProject,
  onDeleteProject,
  onAddTask,
  taskHandlers,
}: {
  project: ProjectWithTasks;
  people: Person[];
  currentPersonId: number | null;
  onRenameProject: (id: number, name: string) => void;
  onDeleteProject: (project: ProjectWithTasks) => void;
  onAddTask: (projectId: number, input: { title: string; due_date: string | null }) => void;
  taskHandlers: {
    onToggle: (task: Task) => void;
    onRename: (id: number, title: string) => void;
    onAssign: (id: number, personId: number | null) => void;
    onSetDue: (id: number, due: string | null) => void;
    onDelete: (task: Task) => void;
  };
}) {
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
      <header className="flex items-center gap-3 px-0 py-3 border-b border-line/70 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-5 rounded-sm bg-accent-500 flex-shrink-0" />
          <span className="uppercase tracking-[0.12em] text-[15px] font-bold text-ink">
            <EditableText value={project.name} onSave={(v) => onRenameProject(project.id, v)} />
          </span>
        </h2>
        <div className="ml-auto flex items-center gap-3">
          {total > 0 && <ProgressBar completed={doneCount} total={total} />}
          <button
            onClick={() => onDeleteProject(project)}
            className="text-stone-300 hover:text-danger-500 transition-colors text-[18px] leading-none"
            title="Delete project"
          >
            ×
          </button>
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
          <AddTaskForm onAdd={(input) => onAddTask(project.id, input)} />
        </div>
      </div>
    </section>
  );
}
