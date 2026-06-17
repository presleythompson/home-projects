// A person's avatar: their emoji if set, otherwise the first initial on their
// color. Emoji shows bare (no disc) and a bit larger; initial sits on a colored
// circle. Accepts any object with name/color/avatar (people or draft previews).
export default function Avatar({
  person,
  size = 24,
  className = "",
}: {
  person: { name: string; color: string; avatar: string | null };
  size?: number;
  className?: string;
}) {
  const emoji = person.avatar;
  return (
    <span
      className={`rounded-full flex items-center justify-center flex-shrink-0 leading-none ${emoji ? "" : "text-white font-bold"} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: emoji ? Math.round(size * 0.9) : Math.round(size * 0.45),
        ...(emoji ? {} : { background: person.color }),
      }}
      title={person.name}
    >
      {emoji ? emoji : person.name.charAt(0).toUpperCase()}
    </span>
  );
}
