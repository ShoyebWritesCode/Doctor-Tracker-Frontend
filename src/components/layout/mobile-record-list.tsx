import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function MobileRecordList({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "divide-border rounded-panel border-border bg-surface-raised divide-y border",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function MobileRecord({
  actions,
  children,
  title,
  headingLevel = 2,
}: {
  actions?: ReactNode;
  children: ReactNode;
  title: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <li className="grid min-w-0 grid-cols-1 gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <Heading className="text-ink min-w-0 font-semibold [overflow-wrap:anywhere]">
          {title}
        </Heading>
        {actions}
      </div>
      <dl className="grid grid-cols-[minmax(5rem,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        {children}
      </dl>
    </li>
  );
}

export function MobileRecordField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </>
  );
}
