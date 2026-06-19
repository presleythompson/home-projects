"use client";

import { useState } from "react";
import type { Person, Task, ProjectWithTasks } from "@/lib/types";
import { compareByDue, compareByCompleted, isStaleCompleted } from "@/lib/util";
import Avatar from "./Avatar";
import TaskRow from "./TaskRow";
import SortableTaskList from "./SortableTaskList";
import AddTaskForm from "./AddTaskForm";

type Handlers = {
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onChangeProject: (id: number, projectId: number) => void;
  onSetNotes: (id: number, notes: string) => void;
  onDelete: (task: Task) => void;
};

type Section = {
  key: string;
  person: Person | null;
  name: string;
  open: Task[];
  completed: Task[];
};

// Groups tasks by assignee: one section per person (in sort_order) plus an
// Unassigned bucket. Same data as the project view, regrouped — so handing a
// person their section is their to-do list. Completed tasks show below the open
// ones with the same 1-day hide rule as the project view.
export default function PeopleView({
  people,
  projects,
  looseTasks,
  onlyPersonId,
  currentPersonId,
  expandedTaskId,
  onExpand,
  taskHandlers,
  onReorderTasks,
  onAddTask,
}: {
  people: Person[];
  projects: ProjectWithTasks[];
  looseTasks: Task[];
  // When set ("My tasks" filter), show only this person's section — no other
  // people, no Unassigned bucket.
  onlyPersonId: number | null;
  currentPersonId: number | null;
  expandedTaskId: number | null;
  onExpand: (id: number | null) => void;
  taskHandlers: Handlers;
  onReorderTasks: (ids: number[]) => void;
  onAddTask: (
    projectId: number | null,
    input: { title: string; due_date: string | null; assignee_id: number | null }
  ) => void;
}) {
  // Every task carries its project name for context once grouping is by person.
  const labeled: { task: Task; projectLabel: string }[] = [
    ...projects.flatMap((p) => p.tasks.map((task) => ({ task, projectLabel: p.name }))),
    ...looseTasks.map((task) => ({ task, projectLabel: "Unfiled" })),
  ];
  const labelById = new Map(labeled.map((l) => [l.task.id, l.projectLabel]));

  const openFor = (predicate: (t: Task) => boolean) =>
    labeled
      .filter((l) => !l.task.is_done && predicate(l.task))
      .map((l) => l.task)
      .sort(compareByDue);

  const completedFor = (predicate: (t: Task) => boolean) =>
    labeled
      .filter((l) => l.task.is_done && predicate(l.task))
      .map((l) => l.task)
      .sort(compareByCompleted);

  const sections: Section[] = [
    ...people
      .filter((person) => onlyPersonId == null || person.id === onlyPersonId)
      .map((person) => ({
        key: `person-${person.id}`,
        person: person as Person | null,
        name: person.name,
        open: openFor((t) => t.assignee_id === person.id),
        completed: completedFor((t) => t.assignee_id === person.id),
      })),
    // Unassigned bucket is hidden when filtering to a single person's tasks.
    ...(onlyPersonId == null
      ? [
          {
            key: "unassigned",
            person: null as Person | null,
            name: "Unassigned",
            open: openFor((t) => t.assignee_id == null),
            completed: completedFor((t) => t.assignee_id == null),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {sections.map((section, i) => (
        <div
          key={section.key}
          className="rise-in relative"
          style={{ animationDelay: `${i * 60}ms`, zIndex: sections.length - i }}
        >
          <PersonSection
            section={section}
            people={people}
            currentPersonId={currentPersonId}
            projects={projects}
            expandedTaskId={expandedTaskId}
            onExpand={onExpand}
            taskHandlers={taskHandlers}
            onReorderTasks={onReorderTasks}
            onAddTask={onAddTask}
            labelById={labelById}
          />
        </div>
      ))}
    </div>
  );
}

function PersonSection({
  section,
  people,
  currentPersonId,
  projects,
  expandedTaskId,
  onExpand,
  taskHandlers,
  onReorderTasks,
  onAddTask,
  labelById,
}: {
  section: Section;
  people: Person[];
  currentPersonId: number | null;
  projects: ProjectWithTasks[];
  expandedTaskId: number | null;
  onExpand: (id: number | null) => void;
  taskHandlers: Handlers;
  onReorderTasks: (ids: number[]) => void;
  onAddTask: (
    projectId: number | null,
    input: { title: string; due_date: string | null; assignee_id: number | null }
  ) => void;
  labelById: Map<number, string>;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  const hiddenCount = section.completed.filter(isStaleCompleted).length;
  const completedVisible = section.completed.filter((t) => showCompleted || !isStaleCompleted(t));
  const empty = section.open.length === 0 && completedVisible.length === 0;

  return (
    <section className="border-b-2 border-[#d8c7a0] pb-5 sm:pb-0 sm:bg-paper sm:rounded-2xl sm:shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] sm:border sm:border-line">
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
            {section.open.length} to do
          </span>
        </div>
      </header>

      <div className="px-0 py-2 sm:px-6 sm:py-3">
        {empty ? (
          <p className="text-[14px] text-muted italic py-1">
            {section.person ? "Nothing assigned." : "Nothing unassigned."}
          </p>
        ) : (
          <>
            {section.open.length > 0 && (
              <SortableTaskList
                tasks={section.open}
                people={people}
                currentPersonId={currentPersonId}
                projects={projectOptions}
                expandedTaskId={expandedTaskId}
                onExpand={onExpand}
                taskHandlers={taskHandlers}
                onReorder={onReorderTasks}
                projectLabelFor={(t) => labelById.get(t.id)}
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
                    projects={projectOptions}
                    expanded={task.id === expandedTaskId}
                    onExpand={onExpand}
                    projectLabel={labelById.get(task.id)}
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
            defaultAssigneeId={section.person?.id ?? null}
            showAssignee={false}
            projects={projectOptions}
            onAdd={(input) => onAddTask(input.project_id ?? null, input)}
          />
        </div>
      </div>
    </section>
  );
}
