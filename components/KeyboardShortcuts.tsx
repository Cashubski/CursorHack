"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

/**
 * Lightweight global shortcuts:
 *   n        -> new bug report (/intake)
 *   g then d -> dashboard (/)
 * Ignored while typing in a field or with modifier keys held.
 */
export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let awaitingG = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (awaitingG) {
        awaitingG = false;
        if (gTimer) clearTimeout(gTimer);
        if (key === "d") {
          e.preventDefault();
          router.push("/");
          return;
        }
      }

      if (key === "n") {
        e.preventDefault();
        router.push("/intake");
      } else if (key === "g") {
        awaitingG = true;
        gTimer = setTimeout(() => {
          awaitingG = false;
        }, 800);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [router]);

  return null;
}
