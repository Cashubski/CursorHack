"use client";

import { useEffect } from "react";
import { initCollab } from "@/lib/collab";

/** Boots identity + presence once, app-wide. Renders nothing. */
export default function CollabProvider() {
  useEffect(() => {
    const cleanup = initCollab();
    return cleanup;
  }, []);
  return null;
}
