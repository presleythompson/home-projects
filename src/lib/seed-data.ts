// Starter data inserted by POST /api/seed on a fresh database.
// Everything here is editable in the app afterward (people, projects, tasks).

export const seedData = {
  // The household. Rename / recolor / add / remove in the app.
  people: [
    { name: "Presley", color: "#3b7dd8" }, // blue
    { name: "Pamela", color: "#9b59b6" }, // purple
    { name: "Brad", color: "#10b981" }, // emerald green
  ],

  // Start with a clean slate — no sample projects/tasks.
  projects: [] as {
    name: string;
    description?: string;
    tasks: { title: string; recurrence?: "daily" | "weekly" }[];
  }[],
};
