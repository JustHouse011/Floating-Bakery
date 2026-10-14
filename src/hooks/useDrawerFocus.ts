import { useEffect, type RefObject } from "react";
export function useDrawerFocus(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open || !root.current) return;
    const panel = root.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),[tabindex="0"]',
        ),
      ).filter((e) => e.getBoundingClientRect().width > 0);
    items()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        const controls = items();
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    panel.addEventListener("keydown", key);
    const focus = (e: FocusEvent) => {
      if (e.target instanceof Node && !panel.contains(e.target))
        items()[0]?.focus();
    };
    document.addEventListener("focusin", focus);
    const button = trigger.current;
    return () => {
      panel.removeEventListener("keydown", key);
      document.removeEventListener("focusin", focus);
      document.body.style.overflow = previous;
      button?.focus();
    };
  }, [open, root, trigger, close]);
}
