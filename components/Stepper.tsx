"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/intake", label: "Intake" },
  { path: "/brief", label: "Brief" },
  { path: "/run", label: "Run" },
  { path: "/review", label: "Review" }
];

export default function Stepper() {
  const pathname = usePathname();
  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  // Only render inside the pipeline, not on the dashboard.
  if (activeIndex === -1) return null;

  return (
    <div className="border-b border-slate-200 bg-white">
      <nav
        aria-label="Progress"
        className="mx-auto flex w-full max-w-2xl items-center gap-1.5 px-4 py-3 sm:px-6"
      >
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={step.path} className="flex flex-1 items-center gap-2">
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                  active
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  active
                    ? "text-brand-700"
                    : done
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded ${
                    done ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
