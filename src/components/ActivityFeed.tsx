"use client";

import type { Activity, Person } from "@/lib/types";
import { timeAgo } from "@/lib/util";
import Avatar from "./Avatar";

const VERB: Record<string, string> = {
  completed: "completed",
  reopened: "reopened",
  assigned: "assigned",
  created: "added",
};

// Color the verb by meaning: green = done, amber = added/assigned, muted = reopened.
const VERB_TONE: Record<string, string> = {
  completed: "text-success-700 font-medium",
  reopened: "text-muted",
  assigned: "text-accent-600",
  created: "text-accent-600",
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
            {person ? (
              <span className="mt-0.5"><Avatar person={person} size={20} /></span>
            ) : (
              <span className="w-5 h-5 mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#b8b0a4" }}>
                ?
              </span>
            )}
            <div className="min-w-0">
              <span className="text-stone-700">
                <span className="font-semibold">{person?.name ?? "Someone"}</span>{" "}
                <span className={VERB_TONE[a.action] ?? ""}>{VERB[a.action] ?? a.action}</span>
                {a.detail ? <span className="text-stone-500"> “{a.detail}”</span> : null}
              </span>
              <span className="text-muted"> · {timeAgo(a.created_at)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
