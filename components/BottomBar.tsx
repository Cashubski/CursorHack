"use client";

import type { ReactNode } from "react";

/**
 * Primary action bar for a pipeline screen. In-flow (not fixed) and centered to
 * the content column so it reads as a proper web layout.
 */
export default function BottomBar({
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  helper
}: {
  primaryLabel: string;
  primaryIcon?: ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  helper?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-ink-200/70 pt-4 sm:flex-row sm:items-center">
      {helper && (
        <p className="order-2 text-sm text-ink-400 sm:order-1 sm:mr-auto">
          {helper}
        </p>
      )}
      <div className="order-1 flex gap-3 sm:order-2 sm:ml-auto">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-card transition hover:bg-ink-50 active:scale-[0.98]"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-iris-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(108,94,245,0.6)] transition hover:bg-iris-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none"
        >
          {primaryIcon}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
