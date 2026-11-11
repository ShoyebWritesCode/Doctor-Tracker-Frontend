import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function TableShell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-panel border-border bg-surface-raised overflow-hidden border",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table
          aria-label={label}
          className="w-full min-w-[42rem] border-collapse text-left text-sm [&_tbody_tr:last-child_td]:border-b-0"
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export const tableHeaderClassName =
  "border-b border-border bg-surface-subtle px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase";
export const tableCellClassName = "border-b border-border px-4 py-3 align-middle text-ink";
