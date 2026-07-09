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
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname.startsWith(s.path))
  );

  return (
    <nav
      aria-label="Progress"
      className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-5 py-3"
    >
      {STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={step.path} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  active
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded ${
                    done ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${
                active ? "text-brand-700" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
