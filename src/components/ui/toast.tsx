"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "info" | "success" | "danger";
type ToastInput = { description?: string; title: string; tone?: ToastTone };
type ToastRecord = ToastInput & { id: number };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);
const icons = { danger: CircleAlert, info: Info, success: CheckCircle2 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const notify = useCallback((toast: ToastInput) => {
    setToasts((current) => [...current, { ...toast, id: Date.now() + Math.random() }]);
  }, []);
  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(({ description, id, title, tone = "info" }) => {
          const Icon = icons[tone];
          return (
            <ToastPrimitive.Root
              className="rounded-panel border-border bg-surface-raised shadow-panel grid grid-cols-[auto_1fr_auto] gap-x-3 border p-4"
              key={id}
              onOpenChange={(open) => {
                if (!open) setToasts((current) => current.filter((toast) => toast.id !== id));
              }}
            >
              <Icon
                aria-hidden="true"
                className={
                  tone === "danger"
                    ? "text-danger mt-0.5 size-5"
                    : tone === "success"
                      ? "text-success mt-0.5 size-5"
                      : "text-action mt-0.5 size-5"
                }
              />
              <div>
                <ToastPrimitive.Title className="text-ink text-sm font-semibold">
                  {title}
                </ToastPrimitive.Title>
                {description ? (
                  <ToastPrimitive.Description className="text-ink-muted mt-1 text-sm leading-5">
                    {description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss notification"
                className="rounded-control text-ink-muted hover:bg-surface-subtle -m-2 inline-flex size-10 items-center justify-center"
              >
                <X aria-hidden="true" className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[60] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider");
  return notify;
}
