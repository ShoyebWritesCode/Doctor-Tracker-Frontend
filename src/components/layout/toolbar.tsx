import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Toolbar({
  children,
  className,
  label = "List controls",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn(
        "border-border bg-surface flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      role="group"
    >
      {children}
    </div>
  );
}
