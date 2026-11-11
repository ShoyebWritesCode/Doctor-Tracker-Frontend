import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex min-h-6 w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
  {
    defaultVariants: { tone: "neutral" },
    variants: {
      tone: {
        danger: "border-red-200 bg-danger-soft text-danger",
        info: "border-teal-200 bg-action-soft text-action-hover",
        neutral: "border-border bg-surface-subtle text-ink-muted",
        success: "border-green-200 bg-success-soft text-success",
        warning: "border-amber-200 bg-warning-soft text-warning",
      },
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
