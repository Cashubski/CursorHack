import type { ReactNode } from "react";

export default function Card({
  title,
  action,
  children,
  className = ""
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`animate-slideUp rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
