"use client";

import type { Activity, Person } from "@/lib/types";
import { timeAgo } from "@/lib/util";

const VERB: Record<string, string> = {
  completed: "completed",
  reopened: "reopened",
  assigned: "assigned",
  created: "added",
};

export default function ActivityFeed({
  activity,
  people,
}: {
  activity: Activity[];
  people: Person[];
}) {
  if (activity.length === 0) {
    return (
      <p className="text-[14px] text-muted italic">No activity yet.</p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {activity.map((a) => {
        const person = people.find((p) => p.id === a.person_id);
        return (
          <li key={a.id} className="flex items-start gap-2.5 text-[14px]">
            <span
              className="w-5 h-5 mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: person?.color ?? "#b8b0a4" }}
            >
              {person ? person.name.charAt(0).toUpperCase() : "?"}
            </span>
            <div className="min-w-0">
              <span className="text-slate-700">
                <span className="font-semibold">{person?.name ?? "Someone"}</span>{" "}
                {VERB[a.action] ?? a.action}
                {a.detail ? <span className="text-slate-500"> “{a.detail}”</span> : null}
              </span>
              <span className="text-muted"> · {timeAgo(a.created_at)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
