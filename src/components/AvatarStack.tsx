// Overlapping row of assignee avatars. A SINGLE assignee renders as a plain
// Avatar (bare emoji, no border). Only when there are MULTIPLE do we add the
// framing that makes the overlap legible: a paper-colored separating ring, and
// emoji on a white circle with a thin outline. Past `max`, the rest collapse
// into a "+N" chip. Renders nothing when there are no people — callers show
// their own empty state.
import Avatar from "./Avatar";

type AvatarLike = { name: string; color: string; avatar: string | null };

export default function AvatarStack({
  people,
  size = 24,
  max = 3,
  className = "",
}: {
  people: AvatarLike[];
  size?: number;
  max?: number;
  className?: string;
}) {
  if (people.length === 0) return null;
  // Single assignee: plain, unframed avatar (no white circle / separating ring).
  if (people.length === 1) {
    return <Avatar person={people[0]} size={size} className={className} />;
  }

  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const box = { width: size, height: size };

  return (
    <span className={`inline-flex items-center ${className}`}>
      {shown.map((p, i) => {
        const emoji = p.avatar;
        return (
          <span
            key={i}
            title={p.name}
            className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 leading-none ring-2 ring-paper ${
              i > 0 ? "-ml-2" : ""
            } ${emoji ? "bg-white border border-stone-200" : "text-white font-bold"}`}
            style={{
              ...box,
              zIndex: shown.length - i,
              fontSize: emoji ? Math.round(size * 0.58) : Math.round(size * 0.45),
              ...(emoji ? {} : { background: p.color }),
            }}
          >
            {emoji ? emoji : p.name.charAt(0).toUpperCase()}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="relative inline-flex items-center justify-center rounded-full flex-shrink-0 leading-none ring-2 ring-paper -ml-2 bg-stone-200 text-stone-600 font-semibold"
          style={{ ...box, zIndex: 0, fontSize: Math.round(size * 0.4) }}
          title={`+${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
