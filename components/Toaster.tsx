"use client";

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useToasts, type ToastKind } from "@/lib/toast";

const ICON: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-400" />,
  error: <AlertTriangle size={16} className="text-rose-400" />,
  info: <Info size={16} className="text-iris-300" />
};

const ACCENT: Record<ToastKind, string> = {
  success: "before:bg-emerald-400",
  error: "before:bg-rose-400",
  info: "before:bg-iris-400"
};

export default function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 px-4 py-3 text-white shadow-pop backdrop-blur-xl before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] motion-safe:animate-toastIn ${ACCENT[t.kind]}`}
        >
          <span className="mt-0.5 shrink-0">{ICON[t.kind]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs leading-snug text-white/60">
                {t.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
