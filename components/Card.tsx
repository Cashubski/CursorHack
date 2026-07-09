import type { ReactNode } from "react";

export default function Card({
  title,
  icon,
  action,
  children,
  className = ""
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`animate-slideUp rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card sm:p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-ink-400">{icon}</span>}
            {title && (
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
