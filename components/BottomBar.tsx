"use client";

import type { ReactNode } from "react";

/**
 * Primary action bar for a pipeline screen. In-flow (not fixed) and centered to
 * the content column so it reads as a proper web layout.
 */
export default function BottomBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  helper
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  helper?: ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
      {helper && (
        <p className="order-2 text-sm text-slate-500 sm:order-1 sm:mr-auto">
          {helper}
        </p>
      )}
      <div className="order-1 flex gap-3 sm:order-2 sm:ml-auto">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
