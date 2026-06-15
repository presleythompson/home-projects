"use client";

import { useState } from "react";
import type { Person, Recurrence, Task, ProjectWithTasks } from "@/lib/types";
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
  onAddTask: (projectId: number, input: { title: string; due_date: string | null; recurrence: Recurrence }) => void;
  taskHandlers: {
    onToggle: (task: Task) => void;
    onRename: (id: number, title: string) => void;
    onAssign: (id: number, personId: number | null) => void;
    onSetDue: (id: number, due: string | null) => void;
    onSetRecurrence: (id: number, r: Recurrence) => void;
    onDelete: (task: Task) => void;
  };
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Recurring tasks never "complete" permanently, so count only one-time tasks
  // toward the progress bar.
  const oneTime = project.tasks.filter((t) => t.recurrence === null);
  const doneCount = oneTime.filter((t) => t.is_done).length;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-slate-300 hover:text-slate-500 transition-colors text-[13px] w-4"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▸" : "▾"}
        </button>
        <h2 className="text-[17px] font-semibold text-slate-800">
          <EditableText value={project.name} onSave={(v) => onRenameProject(project.id, v)} />
        </h2>
        <div className="ml-auto flex items-center gap-3">
          {oneTime.length > 0 && <ProgressBar completed={doneCount} total={oneTime.length} />}
          <button
            onClick={() => onDeleteProject(project)}
            className="text-slate-300 hover:text-danger-500 transition-colors text-[18px] leading-none"
            title="Delete project"
          >
            ×
          </button>
        </div>
      </header>

      {!collapsed && (
        <div className="px-5 py-2.5">
          {project.tasks.length === 0 ? (
            <p className="text-[14px] text-muted italic py-1">No tasks yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {project.tasks.map((task) => (
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
      )}
    </section>
  );
}
