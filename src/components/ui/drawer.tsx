"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/cn";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DrawerContent({ children, className, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-ink/45 fixed inset-0 z-40 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          "border-border bg-surface-raised shadow-panel fixed inset-y-0 right-0 z-50 w-[min(28rem,calc(100%-1rem))] overflow-y-auto border-l p-5 outline-none sm:p-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close drawer"
          className="rounded-control text-ink-muted hover:bg-surface-subtle hover:text-ink absolute top-3 right-3 inline-flex size-11 items-center justify-center"
        >
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
