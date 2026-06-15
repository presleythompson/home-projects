"use client";

import { useEffect, useState } from "react";
import type {
  Person,
  Task,
  Activity,
  Recurrence,
  ProjectWithTasks,
} from "@/lib/types";
import { normalizeTask, normalizePerson, normalizeProject, normalizeActivity } from "@/lib/util";
import PersonSwitcher from "./PersonSwitcher";
import ProjectSection from "./ProjectSection";
import AddProjectForm from "./AddProjectForm";
import ActivityFeed from "./ActivityFeed";
import TaskRow from "./TaskRow";
import ConfirmDialog from "./ConfirmDialog";

const PERSON_KEY = "home-tasks:currentPersonId";

type Confirm =
  | { kind: "task"; task: Task }
  | { kind: "project"; project: ProjectWithTasks }
  | null;

export default function TaskApp({
  seeded,
  initialPeople,
  initialProjects,
  initialLooseTasks,
  initialActivity,
}: {
  seeded: boolean;
  initialPeople: Person[];
  initialProjects: ProjectWithTasks[];
  initialLooseTasks: Task[];
  initialActivity: Activity[];
}) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [projects, setProjects] = useState<ProjectWithTasks[]>(initialProjects);
  const [looseTasks, setLooseTasks] = useState<Task[]>(initialLooseTasks);
  const [activity, setActivity] = useState<Activity[]>(initialActivity);
  const [currentPersonId, setCurrentPersonId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [seeding, setSeeding] = useState(false);

  // Restore "who's using this" from the browser.
  useEffect(() => {
    const stored = localStorage.getItem(PERSON_KEY);
    if (stored && initialPeople.some((p) => p.id === Number(stored))) {
      setCurrentPersonId(Number(stored));
    }
  }, [initialPeople]);

  function pickPerson(id: number) {
    setCurrentPersonId(id);
    localStorage.setItem(PERSON_KEY, String(id));
  }

  async function refreshActivity() {
    const res = await fetch("/api/activity");
    if (res.ok) setActivity((await res.json()).map(normalizeActivity));
  }

  // --- people ---
  async function addPerson(name: string) {
    const res = await fetch("/api/people", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const person: Person = normalizePerson(await res.json());
    setPeople((prev) => [...prev, person]);
    if (currentPersonId == null) pickPerson(person.id);
  }

  // --- projects ---
  async function addProject(name: string) {
    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    const project = normalizeProject(await res.json());
    setProjects((prev) => [...prev, { ...project, tasks: [] }]);
  }

  async function renameProject(id: number, name: string) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  }

  async function deleteProject(project: ProjectWithTasks) {
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
  }

  // --- task state helpers ---
  function replaceTask(updated: Task) {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
    );
    setLooseTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function removeTaskFromState(id: number) {
    setProjects((prev) =>
      prev.map((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) }))
    );
    setLooseTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // --- tasks ---
  async function addTask(
    projectId: number,
    input: { title: string; due_date: string | null; recurrence: Recurrence }
  ) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, ...input, actorId: currentPersonId }),
    });
    const task = normalizeTask(await res.json());
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p))
    );
    refreshActivity();
  }

  async function toggleTask(task: Task) {
    const reopen = task.is_done; // only one-time tasks can be "done"
    const res = await fetch(`/api/tasks/${task.id}/complete`, {
      method: reopen ? "DELETE" : "POST",
      body: JSON.stringify({ actorId: currentPersonId }),
    });
    if (res.ok) replaceTask(normalizeTask(await res.json()));
    refreshActivity();
  }

  async function patchTask(id: number, patch: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patch, actorId: currentPersonId }),
    });
    if (res.ok) replaceTask(normalizeTask(await res.json()));
  }

  const taskHandlers = {
    onToggle: toggleTask,
    onRename: (id: number, title: string) => patchTask(id, { title }),
    onAssign: async (id: number, personId: number | null) => {
      await patchTask(id, { assignee_id: personId });
      refreshActivity();
    },
    onSetDue: (id: number, due: string | null) => patchTask(id, { due_date: due }),
    onSetRecurrence: (id: number, r: Recurrence) => patchTask(id, { recurrence: r }),
    onDelete: (task: Task) => setConfirm({ kind: "task", task }),
  };

  async function doConfirmedDelete() {
    if (!confirm) return;
    if (confirm.kind === "task") {
      removeTaskFromState(confirm.task.id);
      await fetch(`/api/tasks/${confirm.task.id}`, { method: "DELETE" });
    } else {
      await deleteProject(confirm.project);
    }
    setConfirm(null);
  }

  async function seedDatabase() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    window.location.reload();
  }

  // --- Not seeded yet: show a one-click setup card ---
  if (!seeded) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md text-center">
          <h1 className="text-[22px] font-bold text-slate-800 mb-2">Home Tasks</h1>
          <p className="text-[15px] text-muted mb-6">
            The database isn&apos;t set up yet. Click below to create the tables and
            add a few starter projects.
          </p>
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className="rounded-lg px-5 py-2.5 text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-60"
          >
            {seeding ? "Setting up…" : "Set up the database"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-[26px] font-bold text-slate-800 tracking-tight">Home Tasks</h1>
        <p className="text-[15px] text-muted mb-4">Shared household projects &amp; to-dos</p>
        <PersonSwitcher
          people={people}
          currentPersonId={currentPersonId}
          onPick={pickPerson}
          onAdd={addPerson}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Projects column */}
        <div className="space-y-4">
          {looseTasks.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-3.5">
              <h2 className="text-[17px] font-semibold text-slate-800 mb-1.5">Unfiled</h2>
              <div className="divide-y divide-slate-50">
                {looseTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    people={people}
                    currentPersonId={currentPersonId}
                    {...taskHandlers}
                  />
                ))}
              </div>
            </section>
          )}

          {projects.map((project) => (
            <ProjectSection
              key={project.id}
              project={project}
              people={people}
              currentPersonId={currentPersonId}
              onRenameProject={renameProject}
              onDeleteProject={(p) => setConfirm({ kind: "project", project: p })}
              onAddTask={addTask}
              taskHandlers={taskHandlers}
            />
          ))}

          {projects.length === 0 && (
            <p className="text-[15px] text-muted italic px-1">
              No projects yet — create your first one.
            </p>
          )}

          <div className="pt-1">
            <AddProjectForm onAdd={addProject} />
          </div>
        </div>

        {/* Activity column */}
        <aside className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:sticky lg:top-8">
          <h2 className="text-[15px] font-semibold text-slate-700 mb-3">Recent activity</h2>
          <ActivityFeed activity={activity} people={people} />
        </aside>
      </div>

      {confirm && (
        <ConfirmDialog
          message={
            confirm.kind === "task"
              ? `Delete “${confirm.task.title}”?`
              : `Delete the “${confirm.project.name}” project and all its tasks?`
          }
          onConfirm={doConfirmedDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </main>
  );
}
