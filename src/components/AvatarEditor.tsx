"use client";

import { PERSON_COLORS } from "@/lib/colors";

const EMOJI = [
  "🐙", "🐵", "🐶", "🦊", "🐺", "🦁", "🐯", "🐹", "🐭", "🐰",
  "🐨", "🐼", "🐻‍❄️", "🐻", "🐥", "🦆", "🐸", "🦚", "🦎", "🐍",
  "🐉", "🐬", "🐠", "🐡", "🦑", "🐌", "🦋", "🐛", "🐜", "🐝",
  "🐞", "🌻", "🌼", "🌷", "🍁", "🌸", "☘️", "🍊", "🍋", "🍓",
];

// Color + optional emoji picker. Pick from a curated set, or leave it for the
// first initial.
export default function AvatarEditor({
  color,
  avatar,
  onColor,
  onAvatar,
}: {
  color: string;
  avatar: string | null;
  onColor: (c: string) => void;
  onAvatar: (emoji: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-stone-400">Color</span>
        <div className="grid grid-cols-8 gap-1.5 mt-1.5 justify-items-center">
          {PERSON_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColor(c)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-1 ring-stone-400" : ""}`}
              style={{ background: c }}
              title={c}
            />
          ))}
          <label
            className="w-7 h-7 rounded-full border border-dashed border-stone-300 flex items-center justify-center cursor-pointer text-stone-400 text-[12px] hover:border-stone-400 relative overflow-hidden"
            title="Custom color"
          >
            +
            <input
              type="color"
              value={color}
              onChange={(e) => onColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-stone-400">
            Emoji <span className="text-stone-300 normal-case tracking-normal">(optional)</span>
          </span>
          {avatar && (
            <button
              onClick={() => onAvatar(null)}
              className="text-[12px] text-stone-500 hover:text-accent-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {EMOJI.map((e) => (
            <button
              key={e}
              onClick={() => onAvatar(avatar === e ? null : e)}
              className={`aspect-square rounded-md text-[19px] leading-none flex items-center justify-center hover:bg-accent-100 transition-colors cursor-pointer ${avatar === e ? "bg-accent-100 ring-1 ring-accent-300" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
