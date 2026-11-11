"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { serializeListState, type ListState } from "@/lib/list-state";

export function useListUrl<T extends ListState & Record<string, string | number>>(
  read: (params: URLSearchParams) => T,
) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.toString();
  const state = useMemo(() => read(new URLSearchParams(raw)), [raw, read]);
  const query = serializeListState(state);
  useEffect(() => {
    if (query !== raw) router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [pathname, query, raw, router]);
  const update = useCallback(
    (patch: Partial<T>, replace = false) => {
      const current = read(new URLSearchParams(window.location.search));
      const next = serializeListState({ ...current, page: 1, ...patch });
      if (next === serializeListState(current)) return;
      router[replace ? "replace" : "push"](`${pathname}${next ? `?${next}` : ""}`, {
        scroll: false,
      });
    },
    [pathname, read, router],
  );
  function clear() {
    router.push(pathname, { scroll: false });
  }
  return { state, query, update, clear };
}
