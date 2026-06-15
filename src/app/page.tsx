import { getDb } from "@/lib/db";
import type { Person, Project, Task, Activity, ProjectWithTasks } from "@/lib/types";
import { normalizeTask, normalizePerson, normalizeProject, normalizeActivity } from "@/lib/util";
import TaskApp from "@/components/TaskApp";

export const dynamic = "force-dynamic";

async function getData() {
  const sql = getDb();

  // If the DB hasn't been seeded yet, the tables won't exist. Detect that and
  // tell the client to show a one-click "seed" prompt instead of crashing.
  try {
    const [people, projects, tasks, activity] = await Promise.all([
      sql`SELECT * FROM people ORDER BY sort_order, id`,
      sql`SELECT * FROM projects ORDER BY sort_order, id`,
      sql`SELECT * FROM tasks ORDER BY sort_order, id`,
      sql`SELECT * FROM activity ORDER BY created_at DESC, id DESC LIMIT 30`,
    ]);

    const tasksByProject = new Map<number | null, Task[]>();
    for (const raw of tasks as Task[]) {
      const t = normalizeTask(raw);
      const key = t.project_id ?? null;
      if (!tasksByProject.has(key)) tasksByProject.set(key, []);
      tasksByProject.get(key)!.push(t);
    }

    const projectsWithTasks: ProjectWithTasks[] = (projects as Project[]).map((p) => {
      const np = normalizeProject(p);
      return { ...np, tasks: tasksByProject.get(np.id) ?? [] };
    });

    return {
      seeded: true as const,
      people: (people as Person[]).map(normalizePerson),
      projects: projectsWithTasks,
      looseTasks: tasksByProject.get(null) ?? [],
      activity: (activity as Activity[]).map(normalizeActivity),
    };
  } catch {
    return {
      seeded: false as const,
      people: [] as Person[],
      projects: [] as ProjectWithTasks[],
      looseTasks: [] as Task[],
      activity: [] as Activity[],
    };
  }
}

export default async function Home() {
  const data = await getData();

  return (
    <TaskApp
      seeded={data.seeded}
      initialPeople={data.people}
      initialProjects={data.projects}
      initialLooseTasks={data.looseTasks}
      initialActivity={data.activity}
    />
  );
}
