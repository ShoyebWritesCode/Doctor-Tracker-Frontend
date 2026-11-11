import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  description?: string;
  error?: string;
  label: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      "aria-describedby": ariaDescribedBy,
      className,
      description,
      error,
      id,
      label,
      required,
      rows = 4,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="grid gap-2">
        <label className="text-ink text-sm font-semibold" htmlFor={inputId}>
          {label}
          {required ? <span className="text-danger ml-1">*</span> : null}
        </label>
        <textarea
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            "rounded-control border-border bg-surface-raised text-ink placeholder:text-ink-subtle hover:border-border-strong disabled:bg-surface-subtle w-full resize-y border px-3 py-2 text-base leading-6 shadow-sm transition-colors disabled:cursor-not-allowed md:text-sm",
            error && "border-danger",
            className,
          )}
          id={inputId}
          ref={ref}
          required={required}
          rows={rows}
          {...props}
        />
        {description ? (
          <p className="text-ink-muted text-xs leading-5" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="text-danger text-xs font-medium" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
