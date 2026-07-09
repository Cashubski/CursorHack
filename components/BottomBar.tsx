"use client";

import type { ReactNode } from "react";

/**
 * Sticky bottom action bar pinned inside the phone frame. Rendered per-screen
 * so each screen controls its own primary/secondary actions.
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center">
      <div className="pointer-events-auto w-full max-w-md border-t border-slate-200 bg-white/90 px-5 pb-6 pt-3 backdrop-blur md:rounded-b-[2.25rem]">
        {helper && (
          <p className="mb-2 text-center text-[11px] text-slate-500">{helper}</p>
        )}
        <div className="flex gap-3">
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition active:scale-[0.98]"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="flex-[2] rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
