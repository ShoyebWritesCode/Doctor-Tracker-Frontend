import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Section({
  actions,
  children,
  className,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className={cn("grid gap-4", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-ink text-base font-semibold">{title}</h2>
            {description ? (
              <p className="text-ink-muted mt-1 text-sm leading-5">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
