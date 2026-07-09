"use client";

import { usePathname } from "next/navigation";
import { Check, Inbox, FileText, Cpu, ShieldCheck, type LucideIcon } from "lucide-react";

const STEPS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/intake", label: "Intake", icon: Inbox },
  { path: "/brief", label: "Brief", icon: FileText },
  { path: "/run", label: "Run", icon: Cpu },
  { path: "/review", label: "Review", icon: ShieldCheck }
];

export default function Stepper() {
  const pathname = usePathname();
  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  // Only render inside the pipeline, not on the dashboard.
  if (activeIndex === -1) return null;

  return (
    <div className="border-b border-ink-200/70 bg-white/60 backdrop-blur">
      <nav
        aria-label="Progress"
        className="mx-auto flex w-full max-w-2xl items-center px-4 py-3.5 sm:px-6"
      >
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          const Icon = step.icon;
          return (
            <div key={step.path} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition",
                    active
                      ? "border-transparent bg-iris-500 text-white shadow-[0_4px_12px_-2px_rgba(108,94,245,0.5)]"
                      : done
                        ? "border-transparent bg-ink-900 text-white"
                        : "border-ink-200 bg-white text-ink-400"
                  ].join(" ")}
                >
                  {done ? <Check size={15} strokeWidth={2.5} /> : <Icon size={15} />}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    active ? "text-ink-900" : done ? "text-ink-600" : "text-ink-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-2 h-px flex-1 sm:mx-3 ${
                    done ? "bg-ink-900" : "bg-ink-200"
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
