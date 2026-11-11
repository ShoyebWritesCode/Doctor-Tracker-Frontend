"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { useId, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  description?: string;
  label: string;
};

export function Checkbox({ className, description, id, label, required, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const descriptionId = description ? `${checkboxId}-description` : undefined;

  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        aria-describedby={descriptionId}
        className={cn(
          "border-border-strong bg-surface-raised hover:border-action data-[state=checked]:border-action data-[state=checked]:bg-action data-[state=indeterminate]:border-action data-[state=indeterminate]:bg-action mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        id={checkboxId}
        required={required}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          {props.checked === "indeterminate" ? (
            <Minus aria-hidden="true" className="size-3.5" />
          ) : (
            <Check aria-hidden="true" className="size-3.5" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="grid gap-0.5">
        <label className="text-ink text-sm font-medium" htmlFor={checkboxId}>
          {label}
          {required ? <span className="text-danger ml-1">*</span> : null}
        </label>
        {description ? (
          <p className="text-ink-muted text-xs leading-5" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
