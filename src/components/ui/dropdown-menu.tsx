"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuSub = DropdownPrimitive.Sub;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        className={cn(
          "rounded-panel border-border bg-surface-raised shadow-panel z-50 min-w-48 border p-1",
          className,
        )}
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "text-ink data-[highlighted]:bg-surface-subtle flex min-h-10 cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive && "text-danger data-[highlighted]:bg-danger-soft",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ children, className, ...props }, ref) {
  return (
    <DropdownPrimitive.CheckboxItem
      className={cn(
        "text-ink data-[highlighted]:bg-surface-subtle relative flex min-h-10 cursor-default items-center rounded-md py-2 pr-3 pl-9 text-sm outline-none",
        className,
      )}
      ref={ref}
      {...props}
    >
      <span className="absolute left-3">
        <DropdownPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
});

export function DropdownMenuLabel(props: ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("text-ink-muted px-3 py-2 text-xs font-semibold", props.className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator(
  props: ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>,
) {
  return (
    <DropdownPrimitive.Separator
      className={cn("bg-border my-1 h-px", props.className)}
      {...props}
    />
  );
}

export function DropdownMenuSubTrigger({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger>) {
  return (
    <DropdownPrimitive.SubTrigger
      className={cn(
        "data-[highlighted]:bg-surface-subtle flex min-h-10 items-center px-3 py-2 text-sm outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden="true" className="ml-auto size-4" />
    </DropdownPrimitive.SubTrigger>
  );
}

export const DropdownMenuSubContent = DropdownMenuContent;
