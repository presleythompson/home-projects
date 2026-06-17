"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  Person,
  Task,
  Activity,
  ProjectWithTasks,
} from "@/lib/types";
import { normalizeTask, normalizePerson, normalizeProject, normalizeActivity } from "@/lib/util";
import PersonSwitcher from "./PersonSwitcher";
import ProjectSection from "./ProjectSection";
import AddProjectForm from "./AddProjectForm";
import ActivityFeed from "./ActivityFeed";
import TaskRow from "./TaskRow";
import ConfirmDialog from "./ConfirmDialog";
import NamePrompt from "./NamePrompt";

// Wraps a ProjectSection as a sortable item; the grip handle in the header is
// the drag activator. Keeps the earlier-card-higher z-index for popover layering.
function SortableProject({
  project,
  index,
  count,
  ...sectionProps
}: {
  project: ProjectWithTasks;
  index: number;
  count: number;
} & Omit<React.ComponentProps<typeof ProjectSection>, "project" | "dragHandleProps" | "setActivatorNodeRef">) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : count - index,
    position: "relative",
    animationDelay: `${index * 60}ms`,
  };

  return (
    <div ref={setNodeRef} style={style} className={`rise-in ${isDragging ? "shadow-xl rounded-2xl" : ""}`}>
      <ProjectSection
        project={project}
        dragHandleProps={{ ...attributes, ...listeners }}
        setActivatorNodeRef={setActivatorNodeRef}
        {...sectionProps}
      />
    </div>
  );
}

const PERSON_KEY = "home-tasks:currentPersonId";

type Confirm =
  | { kind: "task"; task: Task }
  | { kind: "project"; project: ProjectWithTasks }
  | { kind: "person"; person: Person }
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
  const [identityReady, setIdentityReady] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [seeding, setSeeding] = useState(false);
  // @dnd-kit generates accessibility ids that differ between server and client,
  // so only mount the drag tree after hydration to avoid a mismatch warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Drag-to-reorder sensors: small move threshold on desktop; short press on
  // touch so the handle drags without hijacking scroll.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Restore "who's using this" from the browser (then we know whether to prompt).
  useEffect(() => {
    const stored = localStorage.getItem(PERSON_KEY);
    if (stored && initialPeople.some((p) => p.id === Number(stored))) {
      setCurrentPersonId(Number(stored));
    }
    setIdentityReady(true);
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
  async function addPerson(name: string, color: string, avatar: string | null) {
    const res = await fetch("/api/people", {
      method: "POST",
      body: JSON.stringify({ name, color, avatar }),
    });
    const person: Person = normalizePerson(await res.json());
    setPeople((prev) => [...prev, person]);
    if (currentPersonId == null) pickPerson(person.id);
  }

  async function updatePerson(id: number, patch: { name?: string; color?: string; avatar?: string | null }) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await fetch(`/api/people/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async function removePerson(person: Person) {
    setPeople((prev) => prev.filter((p) => p.id !== person.id));
    if (currentPersonId === person.id) {
      setCurrentPersonId(null);
      localStorage.removeItem(PERSON_KEY);
    }
    await fetch(`/api/people/${person.id}`, { method: "DELETE" });
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

  async function reorderProjects(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(projects, oldIndex, newIndex);
    const prev = projects;
    setProjects(next); // optimistic

    const res = await fetch("/api/projects/reorder", {
      method: "POST",
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
    if (!res.ok) setProjects(prev); // revert on failure
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
    input: { title: string; due_date: string | null; assignee_id: number | null }
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
    const reopen = task.is_done;
    const res = await fetch(`/api/tasks/${task.id}/complete`, {
      method: reopen ? "DELETE" : "POST",
      body: JSON.stringify({ actorId: currentPersonId }),
    });
    if (res.ok) replaceTask(normalizeTask(await res.json()));
    refreshActivity();
  }

  async function patchTask(id: number, patch: Record<string, unknown>) {
    // Optimistic: apply locally right away so selections feel instant.
    const apply = (t: Task) => (t.id === id ? normalizeTask({ ...t, ...patch } as Task) : t);
    setProjects((prev) => prev.map((p) => ({ ...p, tasks: p.tasks.map(apply) })));
    setLooseTasks((prev) => prev.map(apply));

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patch, actorId: currentPersonId }),
    });
    // Reconcile with the server's canonical row.
    if (res.ok) replaceTask(normalizeTask(await res.json()));
  }

  const taskHandlers = {
    onToggle: toggleTask,
    onRename: (id: number, title: string) => patchTask(id, { title }),
    onAssign: (id: number, personId: number | null) => patchTask(id, { assignee_id: personId }),
    onSetDue: (id: number, due: string | null) => patchTask(id, { due_date: due }),
    onDelete: (task: Task) => setConfirm({ kind: "task", task }),
  };

  async function doConfirmedDelete() {
    if (!confirm) return;
    if (confirm.kind === "task") {
      removeTaskFromState(confirm.task.id);
      await fetch(`/api/tasks/${confirm.task.id}`, { method: "DELETE" });
    } else if (confirm.kind === "project") {
      await deleteProject(confirm.project);
    } else {
      await removePerson(confirm.person);
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
        <div className="bg-paper rounded-2xl shadow-[0_10px_40px_-18px_rgba(80,60,30,0.35)] border border-line p-10 max-w-md text-center">
          <p className="text-[12px] font-semibold tracking-[0.2em] text-accent-600 uppercase mb-3">House &amp; Yard</p>
          <h1 className="font-display text-[40px] leading-none font-semibold text-ink mb-3">Project&nbsp;List</h1>
          <p className="text-[15px] text-muted mb-7">
            The database isn&apos;t set up yet. Click below to create the tables and
            get started.
          </p>
          <button
            onClick={seedDatabase}
            disabled={seeding}
            className="rounded-xl px-6 py-3 text-[15px] font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-60 shadow-sm"
          >
            {seeding ? "Setting up…" : "Set up the database"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <header className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.22em] text-accent-600 uppercase mb-1.5">House &amp; Yard</p>
            <h1 className="font-display font-semibold text-ink tracking-tight leading-[0.95] text-[clamp(35px,6.4vw,58px)]">
              Project List
            </h1>
          </div>
          <div>
            <PersonSwitcher
              people={people}
              currentPersonId={currentPersonId}
              onPick={pickPerson}
              onAdd={addPerson}
              onUpdate={updatePerson}
              onRemove={(person) => setConfirm({ kind: "person", person })}
            />
          </div>
        </div>
        <div className="mt-5 border-t border-line" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7 items-start">
        {/* Projects column */}
        <div className="space-y-5">
          {looseTasks.length > 0 && (
            <section className="bg-paper rounded-2xl shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] border border-line px-6 py-4">
              <h2 className="font-display text-[18px] font-semibold text-ink mb-1.5">Unfiled</h2>
              <div className="divide-y divide-line/60">
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

          {mounted ? (
            <DndContext id="project-reorder" sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderProjects}>
              <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-5">
                  {projects.map((project, i) => (
                    <SortableProject
                      key={project.id}
                      project={project}
                      index={i}
                      count={projects.length}
                      people={people}
                      currentPersonId={currentPersonId}
                      onRenameProject={renameProject}
                      onDeleteProject={(p) => setConfirm({ kind: "project", project: p })}                      onAddTask={addTask}
                      taskHandlers={taskHandlers}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-5">
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className="rise-in relative"
                  style={{ animationDelay: `${i * 60}ms`, zIndex: projects.length - i }}
                >
                  <ProjectSection
                    project={project}
                    people={people}
                    currentPersonId={currentPersonId}
                    onRenameProject={renameProject}
                    onDeleteProject={(p) => setConfirm({ kind: "project", project: p })}
                    onAddTask={addTask}
                    taskHandlers={taskHandlers}
                  />
                </div>
              ))}
            </div>
          )}

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
        <aside className="bg-paper rounded-2xl shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] border border-line p-5 lg:sticky lg:top-8">
          <h2 className="font-display text-[18px] font-semibold text-ink mb-3">Recently done</h2>
          <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            <ActivityFeed activity={activity} people={people} />
          </div>
        </aside>
      </div>

      {confirm && (
        <ConfirmDialog
          message={
            confirm.kind === "task"
              ? `Delete “${confirm.task.title}”?`
              : confirm.kind === "project"
              ? `Delete the “${confirm.project.name}” project and all its tasks?`
              : `Remove ${confirm.person.name}? Their tasks stay but become unassigned.`
          }
          onConfirm={doConfirmedDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {identityReady && currentPersonId === null && (
        <NamePrompt people={people} onPick={pickPerson} onAdd={addPerson} />
      )}
    </main>
  );
}
