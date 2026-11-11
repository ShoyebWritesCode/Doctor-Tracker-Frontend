import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageError({
  description = "We could not load this page. Try again in a moment.",
  onRetry,
  title = "Something went wrong",
}: {
  description?: string;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div className="mx-auto grid max-w-lg justify-items-center gap-4 px-4 py-16 text-center">
      <span className="rounded-control bg-danger-soft text-danger grid size-12 place-items-center">
        <CircleAlert aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-ink text-xl font-semibold">{title}</h1>
        <p className="text-ink-muted mt-2 text-sm leading-6">{description}</p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
