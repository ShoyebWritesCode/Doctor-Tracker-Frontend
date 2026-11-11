"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { showClose?: boolean }
>(function DialogContent({ children, className, showClose = true, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-ink/45 fixed inset-0 z-40 backdrop-blur-[1px] data-[state=closed]:opacity-0" />
      <DialogPrimitive.Content
        className={cn(
          "rounded-panel border-border bg-surface-raised shadow-panel fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 grid-cols-1 gap-5 overflow-y-auto border p-5 outline-none sm:p-6",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            aria-label="Close dialog"
            data-form-dismiss=""
            className="rounded-control text-ink-muted hover:bg-surface-subtle hover:text-ink absolute top-3 right-3 inline-flex size-11 items-center justify-center"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid min-w-0 gap-2 pr-10", className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DialogTitle(props: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-ink text-lg font-semibold [overflow-wrap:anywhere]", props.className)}
      {...props}
    />
  );
}

export function DialogDescription(
  props: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>,
) {
  return (
    <DialogPrimitive.Description
      className={cn("text-ink-muted text-sm leading-6 [overflow-wrap:anywhere]", props.className)}
      {...props}
    />
  );
}
