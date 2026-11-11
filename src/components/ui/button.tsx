import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 py-2 text-sm font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "min-h-11",
        icon: "size-11 p-0",
        small: "min-h-9 px-3 py-1.5 text-xs",
      },
      variant: {
        danger:
          "border-danger bg-danger text-white hover:border-danger-hover hover:bg-danger-hover",
        ghost: "border-transparent bg-transparent text-ink hover:bg-surface-subtle",
        outline: "border-border-strong bg-surface text-ink hover:bg-surface-subtle",
        primary:
          "border-action bg-action text-white hover:border-action-hover hover:bg-action-hover",
        secondary:
          "border-border bg-surface-subtle text-ink hover:border-border-strong hover:bg-surface",
      },
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, className, disabled, loading = false, size, type = "button", variant, ...props },
  ref,
) {
  return (
    <button
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ size, variant }), className)}
      disabled={disabled || loading}
      ref={ref}
      type={type}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
});

export { buttonVariants };
