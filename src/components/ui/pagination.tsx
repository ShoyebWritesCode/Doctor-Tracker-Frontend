import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

export function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7)
    return Array.from({ length: Math.max(totalPages, 0) }, (_, index) => index + 1);
  const items: PaginationItem[] = [1];
  if (page > 4) items.push("ellipsis-start");
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  for (let value = start; value <= end; value += 1) items.push(value);
  if (page < totalPages - 3) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

type PaginationProps = { onPageChange: (page: number) => void; page: number; totalPages: number };

export function Pagination({ onPageChange, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-ink-muted text-sm">
        Page <span className="text-ink font-semibold">{page}</span> of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {getPaginationItems(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <Button
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                key={item}
                onClick={() => onPageChange(item)}
                size="icon"
                variant={item === page ? "primary" : "ghost"}
              >
                {item}
              </Button>
            ) : (
              <span aria-hidden="true" className="text-ink-muted w-8 text-center" key={item}>
                …
              </span>
            ),
          )}
        </div>
        <Button
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
