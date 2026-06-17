import { useEffect } from "react";

// While `active`, a pointer interaction outside `ref` — or, if one exists, the
// nearest [data-edit-group] ancestor of `ref` — calls `onDismiss` AND swallows
// the click that same gesture produces. That way tapping out of an edit field
// or popover dismisses it WITHOUT also activating whatever sits under the
// pointer (the main annoyance on touch: one tap closing this and opening that).
export function useOutsideDismiss(
  active: boolean,
  ref: React.RefObject<HTMLElement | null>,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!active) return;

    function isInside(target: Node | null): boolean {
      const el = ref.current;
      if (!el || !target) return false;
      if (el.contains(target)) return true;
      // A field's sibling controls (date/assignee/trash, etc.) opt into being
      // "inside" by sharing a [data-edit-group] ancestor, so tapping them while
      // editing doesn't count as an outside dismiss.
      const group = el.closest("[data-edit-group]");
      return !!group && group.contains(target);
    }

    function onPointerDown(e: PointerEvent) {
      if (isInside(e.target as Node)) return;
      onDismiss();
      const swallow = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
        document.removeEventListener("click", swallow, true);
      };
      document.addEventListener("click", swallow, true);
      // If the gesture produced no click (a scroll/drag), drop the guard.
      window.setTimeout(() => document.removeEventListener("click", swallow, true), 350);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [active, ref, onDismiss]);
}
