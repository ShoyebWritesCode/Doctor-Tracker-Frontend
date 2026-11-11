import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="border-border grid justify-items-center gap-3 border-y px-4 py-12 text-center">
      <span className="rounded-control bg-surface-subtle text-ink-muted grid size-11 place-items-center">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="text-ink font-semibold">{title}</h2>
        <p className="text-ink-muted mt-1 max-w-md text-sm leading-6">{description}</p>
      </div>
      {action}
    </div>
  );
}
