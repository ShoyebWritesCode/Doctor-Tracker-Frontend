import { CircleAlert } from "lucide-react";

export function InlineError({ children }: { children: string }) {
  return (
    <p className="text-danger flex items-start gap-2 text-sm" role="alert">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
