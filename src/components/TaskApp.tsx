"use client";

import { useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type {
  Person,
  Project,
  Task,
  Activity,
  ProjectWithTasks,
} from "@/lib/types";
import { normalizeTask, normalizePerson, normalizeProject, normalizeActivity } from "@/lib/util";
import PersonSwitcher from "./PersonSwitcher";
import PeopleView from "./PeopleView";
import ProjectSection from "./ProjectSection";
import AddProjectForm from "./AddProjectForm";
import FloatingAdd from "./FloatingAdd";
import ActivityFeed from "./ActivityFeed";
import TaskRow from "./TaskRow";
import ConfirmDialog from "./ConfirmDialog";
import NamePrompt from "./NamePrompt";

const PERSON_KEY = "home-tasks:currentPersonId";
const VIEW_KEY = "home-tasks:view";
const FILTER_KEY = "home-tasks:filter";
type View = "projects" | "people";
type Filter = "all" | "mine";

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
  const [view, setView] = useState<View>("projects");
  const [filter, setFilter] = useState<Filter>("all");
  const [identityReady, setIdentityReady] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [seeding, setSeeding] = useState(false);

  // Restore "who's using this" + the chosen view from the browser.
  useEffect(() => {
    const stored = localStorage.getItem(PERSON_KEY);
    if (stored && initialPeople.some((p) => p.id === Number(stored))) {
      setCurrentPersonId(Number(stored));
    }
    const storedView = localStorage.getItem(VIEW_KEY);
    if (storedView === "people" || storedView === "projects") setView(storedView);
    const storedFilter = localStorage.getItem(FILTER_KEY);
    if (storedFilter === "all" || storedFilter === "mine") setFilter(storedFilter);
    setIdentityReady(true);
  }, [initialPeople]);

  function pickPerson(id: number) {
    setCurrentPersonId(id);
    localStorage.setItem(PERSON_KEY, String(id));
  }

  function pickView(v: View) {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  }

  function pickFilter(f: Filter) {
    setFilter(f);
    localStorage.setItem(FILTER_KEY, f);
  }

  async function refreshActivity() {
    const res = await fetch("/api/activity");
    if (res.ok) setActivity((await res.json()).map(normalizeActivity));
  }

  // Pull the whole board so two people on different devices stay in sync without
  // a manual refresh. Skipped while someone is mid-edit (an input/textarea is
  // focused) or a confirm dialog is open, so it never clobbers in-progress work.
  async function refreshAll() {
    const ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
    if (confirm) return;
    try {
      const [pplRes, projRes, taskRes, actRes] = await Promise.all([
        fetch("/api/people"),
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/activity"),
      ]);
      if (!pplRes.ok || !projRes.ok || !taskRes.ok || !actRes.ok) return;
      const [ppl, proj, tsk, act] = await Promise.all([
        pplRes.json(), projRes.json(), taskRes.json(), actRes.json(),
      ]);

      const tasks = (tsk as Task[]).map(normalizeTask);
      const byProject = new Map<number | null, Task[]>();
      for (const t of tasks) {
        const key = t.project_id ?? null;
        if (!byProject.has(key)) byProject.set(key, []);
        byProject.get(key)!.push(t);
      }

      setPeople((ppl as Person[]).map(normalizePerson));
      setProjects((proj as Project[]).map((p) => {
        const np = normalizeProject(p);
        return { ...np, tasks: byProject.get(np.id) ?? [] };
      }));
      setLooseTasks(byProject.get(null) ?? []);
      setActivity((act as Activity[]).map(normalizeActivity));
    } catch {
      // Network blip — just wait for the next tick.
    }
  }

  // Keep a live ref so the polling interval always calls the latest closure
  // (which sees current state like `confirm`).
  const refreshAllRef = useRef(refreshAll);
  refreshAllRef.current = refreshAll;

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refreshAllRef.current();
    };
    const id = window.setInterval(tick, 8000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);

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
  async function addProject(name: string, isOngoing: boolean) {
    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, is_ongoing: isOngoing }),
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

  async function setProjectOngoing(id: number, isOngoing: boolean) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, is_ongoing: isOngoing } : p)));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_ongoing: isOngoing }),
    });
  }

  async function deleteProject(project: ProjectWithTasks) {
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
  }

  // Reorder a sublist of tasks (one project's list or one person's list).
  // Optimistically permute the sort_order values those tasks already occupy
  // (matches the server), then persist. The comparator re-sorts on render so
  // date precedence holds (cross-date drags snap back).
  async function reorderTasks(ids: number[]) {
    const all: Task[] = [...projects.flatMap((p) => p.tasks), ...looseTasks];
    const byId = new Map(all.map((t) => [t.id, t]));
    const slots = ids
      .map((id) => byId.get(id)?.sort_order)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    const newOrder = new Map<number, number>();
    ids.forEach((id, k) => {
      if (slots[k] != null) newOrder.set(id, slots[k]);
    });
    const apply = (t: Task) => (newOrder.has(t.id) ? { ...t, sort_order: newOrder.get(t.id)! } : t);
    setProjects((prev) => prev.map((p) => ({ ...p, tasks: p.tasks.map(apply) })));
    setLooseTasks((prev) => prev.map(apply));

    const res = await fetch("/api/tasks/reorder", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) refreshAll(); // resync on failure
  }

  // Move a project one slot up/down (via the arrows shown while editing its
  // name). Optimistic, then persist the new order.
  async function moveProject(id: number, dir: -1 | 1) {
    const oldIndex = projects.findIndex((p) => p.id === id);
    const newIndex = oldIndex + dir;
    if (oldIndex === -1 || newIndex < 0 || newIndex >= projects.length) return;

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
  // projectId null = unfiled (e.g. a task added from a person's section in the
  // by-person view); it lands in looseTasks rather than a project.
  async function addTask(
    projectId: number | null,
    input: { title: string; due_date: string | null; assignee_id: number | null }
  ) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, ...input, actorId: currentPersonId }),
    });
    const task = normalizeTask(await res.json());
    if (projectId == null) {
      setLooseTasks((prev) => [...prev, task]);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p))
      );
    }
    refreshActivity();
  }

  async function toggleTask(task: Task) {
    const reopen = task.is_done;
    // Optimistic: flip the checkbox immediately so it feels instant, then
    // reconcile with the server's canonical row (revert on failure).
    replaceTask(
      normalizeTask({
        ...task,
        is_done: !reopen,
        completed_at: reopen ? null : new Date().toISOString(),
        completed_by: reopen ? null : currentPersonId,
      } as Task)
    );

    const res = await fetch(`/api/tasks/${task.id}/complete`, {
      method: reopen ? "DELETE" : "POST",
      body: JSON.stringify({ actorId: currentPersonId }),
    });
    // Reopening reverses the completion — drop its entries from the feed now.
    if (reopen) {
      setActivity((prev) =>
        prev.filter((a) => !(a.task_id === task.id && a.action === "completed"))
      );
    }

    if (res.ok) replaceTask(normalizeTask(await res.json()));
    else replaceTask(task); // revert
    refreshActivity();
  }

  async function clearActivity() {
    setActivity([]);
    await fetch("/api/activity", { method: "DELETE" });
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

  function doConfirmedDelete() {
    const c = confirm;
    if (!c) return;
    // Close the dialog and remove the item immediately — the handlers below all
    // update local state optimistically, so the server DELETE happens in the
    // background. (Previously we awaited the round-trip before closing, which
    // left the dialog hanging for seconds and invited double-clicks.)
    setConfirm(null);
    if (c.kind === "task") {
      removeTaskFromState(c.task.id);
      fetch(`/api/tasks/${c.task.id}`, { method: "DELETE" });
    } else if (c.kind === "project") {
      deleteProject(c.project);
    } else {
      removePerson(c.person);
    }
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

  // "My tasks" filter: keep only tasks assigned to the current person. Applies
  // to both views; FloatingAdd still sees the full project list.
  const mine = filter === "mine";
  const matchesFilter = (t: Task) => !mine || t.assignee_id === currentPersonId;
  // Project view: keep only my tasks, and drop projects I'm not in entirely.
  const visibleProjects = mine
    ? projects
        .map((p) => ({ ...p, tasks: p.tasks.filter(matchesFilter) }))
        .filter((p) => p.tasks.length > 0)
    : projects;
  const visibleLooseTasks = mine ? looseTasks.filter(matchesFilter) : looseTasks;

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
        <div className="mt-5 border-t-2 border-[#d8c7a0]" />
      </header>

      {/* Toggle row, sitting over the task column so the content grid below stays
          top-aligned (Recently done lines up with the first project). FILTER on
          the left, SORT BY right-aligned over the task column's right edge. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7 mb-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase mb-1">Filter</p>
            <div className="inline-flex rounded-lg overflow-hidden border border-line text-[12px]">
              <button
                onClick={() => pickFilter("all")}
                className={`px-3 py-1 transition-colors cursor-pointer ${
                  filter === "all" ? "bg-line/60 text-ink font-medium" : "text-muted hover:text-ink"
                }`}
              >
                All tasks
              </button>
              <button
                onClick={() => pickFilter("mine")}
                className={`px-3 py-1 border-l border-line transition-colors cursor-pointer ${
                  filter === "mine" ? "bg-line/60 text-ink font-medium" : "text-muted hover:text-ink"
                }`}
              >
                My tasks
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted uppercase mb-1">Sort by</p>
            <div className="inline-flex rounded-lg overflow-hidden border border-line text-[12px]">
              <button
                onClick={() => pickView("projects")}
                className={`px-3 py-1 transition-colors cursor-pointer ${
                  view === "projects" ? "bg-line/60 text-ink font-medium" : "text-muted hover:text-ink"
                }`}
              >
                Project
              </button>
              <button
                onClick={() => pickView("people")}
                className={`px-3 py-1 border-l border-line transition-colors cursor-pointer ${
                  view === "people" ? "bg-line/60 text-ink font-medium" : "text-muted hover:text-ink"
                }`}
              >
                Person
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-7 items-start">
        {/* Main column: by project (default) or grouped by person */}
        {view === "people" ? (
          <PeopleView
            people={people}
            projects={projects}
            looseTasks={looseTasks}
            onlyPersonId={mine ? currentPersonId : null}
            currentPersonId={currentPersonId}
            taskHandlers={taskHandlers}
            onReorderTasks={reorderTasks}
            onAddTask={addTask}
          />
        ) : (
        <div className="space-y-5">
          {visibleLooseTasks.length > 0 && (
            <section className="bg-paper rounded-2xl shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] border border-line px-6 py-4">
              <h2 className="font-display text-[18px] font-semibold text-ink mb-1.5">Unfiled</h2>
              <div className="divide-y divide-line/60">
                {visibleLooseTasks.map((task) => (
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

          <div className="space-y-5">
            {visibleProjects.map((project, i) => (
              <div
                key={project.id}
                className="rise-in relative"
                style={{ animationDelay: `${i * 60}ms`, zIndex: visibleProjects.length - i }}
              >
                <ProjectSection
                  project={project}
                  people={people}
                  currentPersonId={currentPersonId}
                  onRenameProject={renameProject}
                  onDeleteProject={(p) => setConfirm({ kind: "project", project: p })}
                  onSetOngoing={setProjectOngoing}
                  onAddTask={addTask}
                  taskHandlers={taskHandlers}
                  onReorderTasks={reorderTasks}
                  onMoveProject={moveProject}
                  isFirst={i === 0}
                  isLast={i === projects.length - 1}
                />
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <p className="text-[15px] text-muted italic px-1">
              No projects yet — create your first one.
            </p>
          )}

          <div className="pt-1">
            <AddProjectForm onAdd={addProject} />
          </div>
        </div>
        )}

        {/* Activity column */}
        <aside className="bg-paper rounded-2xl shadow-[0_6px_24px_-12px_rgba(80,60,30,0.25)] border border-line p-5 lg:sticky lg:top-8">
          <h2 className="font-display text-[18px] font-semibold text-ink mb-3">Recently done</h2>
          <div className="custom-scroll max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            <ActivityFeed activity={activity} people={people} />
          </div>
          {activity.length > 0 && (
            <div className="mt-3 text-right">
              <button
                onClick={clearActivity}
                className="text-[12px] text-stone-400 hover:text-accent-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
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

      {/* Always-visible add — opens a panel with a required project picker. */}
      {identityReady && currentPersonId !== null && (
        <FloatingAdd
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          people={people}
          currentPersonId={currentPersonId}
          onAdd={addTask}
        />
      )}
    </main>
  );
}
