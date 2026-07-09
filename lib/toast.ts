"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const TTL_MS = 4200;

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, TTL_MS);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
}));

/** Fire-and-forget toast helpers usable from anywhere on the client. */
export const toast = {
  success: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "error", title, description }),
  info: (title: string, description?: string) =>
    useToasts.getState().push({ kind: "info", title, description })
};
