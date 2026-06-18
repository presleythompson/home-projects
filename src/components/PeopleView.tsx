"use client";

import { useState } from "react";
import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import { compareByDue } from "@/lib/util";
import Avatar from "./Avatar";
import SortableTaskList from "./SortableTaskList";
import AddTaskForm from "./AddTaskForm";
import { ReorderIcon } from "./icons";

type Handlers = {
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
};

// Groups open tasks by assignee: one section per person (in sort_order) plus an
// Unassigned bucket. Same data as the project view, regrouped — so handing a
// person their section is their to-do list. Completed tasks are omitted here.
export default function PeopleView({
  people,
  projects,
  looseTasks,
  currentPersonId,
  taskHandlers,
  onReorderTasks,
  onAddTask,
}: {
  people: Person[];
  projects: ProjectWithTasks[];
  looseTasks: Task[];
  currentPersonId: number | null;
  taskHandlers: Handlers;
  onReorderTasks: (ids: number[]) => void;
  onAddTask: (
    projectId: number | null,
    input: { title: string; due_date: string | null; assignee_id: number | null }
  ) => void;
}) {
  // Only one section is in reorder mode at a time (tracked by section key).
  const [reorderingKey, setReorderingKey] = useState<string | null>(null);

  // Every task carries its project name for context once grouping is by person.
  const labeled: { task: Task; projectLabel: string }[] = [
    ...projects.flatMap((p) => p.tasks.map((task) => ({ task, projectLabel: p.name }))),
    ...looseTasks.map((task) => ({ task, projectLabel: "Unfiled" })),
  ];
  const labelById = new Map(labeled.map((l) => [l.task.id, l.projectLabel]));

  const openFor = (predicate: (t: Task) => boolean) =>
    labeled
      .filter((l) => !l.task.is_done && predicate(l.task))
      .sort((a, b) => compareByDue(a.task, b.task));

  const sections = [
    ...people.map((person) => ({
      key: `person-${person.id}`,
      person: person as Person | null,
      name: person.name,
      items: openFor((t) => t.assignee_id === person.id),
    })),
    {
      key: "unassigned",
      person: null as Person | null,
      name: "Unassigned",
      items: openFor((t) => t.assignee_id == null),
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((section, i) => (
        <div
          key={section.key}
          className="rise-in relative"
          style={{ animationDelay: `${i * 60}ms`, zIndex: sections.length - i }}
        >
          <section
            data-reordering={reorderingKey === section.key || undefined}
            className="border-b-2 border-[#d8c7a0] pb-5 sm:pb-0 sm:bg-paper sm:rounded-2xl sm:shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] sm:border sm:border-line"
          >
            <header className="px-0 py-3 border-b border-line/70 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2.5">
                {section.person ? (
                  <Avatar person={section.person} size={26} />
                ) : (
                  <span className="w-[26px] h-[26px] rounded-full border border-dashed border-stone-300 text-stone-400 flex items-center justify-center text-[13px] flex-shrink-0">
                    ?
                  </span>
                )}
                <h2 className="flex-1 min-w-0 text-[15px] font-bold text-ink truncate">{section.name}</h2>
                <span className="text-[13px] font-semibold text-muted tabular-nums flex-shrink-0">
                  {section.items.length} to do
                </span>
              </div>
            </header>

            <div className="px-0 py-2 sm:px-6 sm:py-3">
              {section.items.length === 0 ? (
                <p className="text-[14px] text-muted italic py-1">
                  {section.person ? "Nothing assigned." : "Nothing unassigned."}
                </p>
              ) : (
                <SortableTaskList
                  tasks={section.items.map((i) => i.task)}
                  people={people}
                  currentPersonId={currentPersonId}
                  taskHandlers={taskHandlers}
                  onReorder={onReorderTasks}
                  projectLabelFor={(t) => labelById.get(t.id)}
                  reordering={reorderingKey === section.key}
                />
              )}
              {reorderingKey === section.key ? (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setReorderingKey(null)}
                    className="text-[13px] font-semibold text-accent-600 hover:text-accent-700 transition-colors cursor-pointer"
                  >
                    Done reordering
                  </button>
                </div>
              ) : (
                <div className="pt-1.5 flex items-center">
                  <AddTaskForm
                    people={people}
                    currentPersonId={currentPersonId}
                    defaultAssigneeId={section.person?.id ?? null}
                    showAssignee={false}
                    projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                    onAdd={(input) => onAddTask(input.project_id ?? null, input)}
                  />
                  {section.items.length >= 2 && (
                    <button
                      onClick={() => setReorderingKey(section.key)}
                      className="ml-auto inline-flex items-center gap-1 text-[12px] text-stone-400 hover:text-accent-600 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <ReorderIcon className="w-3.5 h-3.5" />
                      Reorder
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}
