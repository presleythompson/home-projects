export interface Person {
  id: number;
  name: string;
  color: string;
  avatar: string | null; // emoji; null = show first initial
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  notes: string | null;
  due_date: string | null; // YYYY-MM-DD
  assignee_id: number | null;
  is_done: boolean;
  completed_at: string | null;
  completed_by: number | null;
  sort_order: number;
  created_at: string;
}

export type ActivityAction = "completed" | "reopened" | "assigned" | "created";

export interface Activity {
  id: number;
  task_id: number | null;
  person_id: number | null;
  action: ActivityAction;
  detail: string | null;
  created_at: string;
}

// A project carrying its tasks, used for the initial server render
export interface ProjectWithTasks extends Project {
  tasks: Task[];
}
