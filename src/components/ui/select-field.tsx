"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type SelectFieldProps = {
  className?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  label: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
};

export function SelectField({
  className,
  description,
  disabled,
  error,
  id,
  label,
  name,
  onValueChange,
  options,
  placeholder = "Select an option",
  required,
  value,
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = description ? `${selectId}-description` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-ink text-sm font-semibold" htmlFor={selectId}>
        {label}
        {required ? <span className="text-danger ml-1">*</span> : null}
      </label>
      <SelectPrimitive.Root
        disabled={disabled}
        name={name}
        onValueChange={onValueChange}
        required={required}
        value={value}
      >
        <SelectPrimitive.Trigger
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            "rounded-control border-border bg-surface-raised text-ink hover:border-border-strong data-[placeholder]:text-ink-subtle disabled:bg-surface-subtle flex min-h-11 w-full items-center justify-between gap-3 border px-3 py-2 text-left text-base shadow-sm transition-colors disabled:cursor-not-allowed md:text-sm",
            error && "border-danger",
          )}
          id={selectId}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown aria-hidden="true" className="text-ink-muted size-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="rounded-panel border-border bg-surface-raised shadow-panel z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden border p-1"
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  className="text-ink data-[highlighted]:bg-action-soft data-[highlighted]:text-action-hover relative flex min-h-10 cursor-default items-center rounded-md py-2 pr-8 pl-3 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <Check aria-hidden="true" className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
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
}
