"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// One-open-at-a-time coordination. Wrap a set of triggers (e.g. a task's
// project / date / person controls) in <PopoverGroup> so opening one closes the
// others. Without a group, each Popover manages its own open state.
type GroupCtx = { openId: string | null; setOpenId: (id: string | null) => void };
const GroupContext = createContext<GroupCtx | null>(null);

export function PopoverGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <GroupContext.Provider value={{ openId, setOpenId }}>{children}</GroupContext.Provider>;
}

export function Popover({
  trigger,
  children,
  triggerClassName = "inline-flex cursor-pointer",
  triggerTitle,
}: {
  trigger: React.ReactNode;
  // Receives close() so an in-panel selection can dismiss the popover.
  children: (close: () => void) => React.ReactNode;
  triggerClassName?: string;
  triggerTitle?: string;
}) {
  const group = useContext(GroupContext);
  const id = useId();
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === id : localOpen;

  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const setOpen = (v: boolean) => {
    if (group) group.setOpenId(v ? id : null);
    else setLocalOpen(v);
  };

  // Position the portaled panel just under its trigger, in fixed (viewport)
  // coords so it escapes any scroll/overflow ancestor (e.g. the Add Task modal),
  // clamped on-screen and flipped above when there isn't room below.
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const panel = panelRef.current;
      const pw = panel?.offsetWidth ?? 0;
      const ph = panel?.offsetHeight ?? 0;
      const M = 8;
      // On mobile, center the panel horizontally on screen; on larger screens
      // anchor it to the trigger's left edge. Either way clamp it on-screen.
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      let left = isMobile && pw ? (window.innerWidth - pw) / 2 : r.left;
      if (pw) left = Math.max(M, Math.min(left, window.innerWidth - pw - M));
      let top = r.bottom + 4;
      if (ph && top + ph > window.innerHeight - M) {
        const above = r.top - 4 - ph;
        top = above > M ? above : Math.max(M, window.innerHeight - ph - M);
      }
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place); // re-place once the panel has size
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // Dismiss on a pointer outside the trigger + panel, or on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <span className="relative inline-flex" ref={anchorRef}>
      <span className={triggerClassName} title={triggerTitle} onClick={() => setOpen(!open)}>
        {trigger}
      </span>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            data-overlay
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: "max-content",
              maxWidth: "calc(100vw - 16px)",
            }}
            className="z-[60]"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
        )}
    </span>
  );
}
