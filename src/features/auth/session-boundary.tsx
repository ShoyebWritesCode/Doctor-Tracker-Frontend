"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PageError } from "@/components/feedback/page-error";
import { PortalShell } from "@/components/layout/portal-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { authKeys, getCurrentAdmin } from "@/features/auth/api";
import { ApiError } from "@/lib/api/client";
import {
  sessionExpiredEvent,
  signOutStartedEvent,
  signOutCancelledEvent,
} from "@/features/auth/session-events";

export function SessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [expired, setExpired] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const query = useQuery({
    queryFn: ({ signal }) => getCurrentAdmin(signal),
    queryKey: authKeys.current,
    enabled: !signingOut,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
  });
  const unauthorized = query.error instanceof ApiError && query.error.status === 401;

  useEffect(() => {
    const expire = () => setExpired(true);
    const hide = () => setRestoring(true);
    const startSignOut = () => setSigningOut(true);
    const cancelSignOut = () => setSigningOut(false);
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setRestoring(true);
      void queryClient
        .resetQueries({ queryKey: authKeys.current })
        .finally(() => setRestoring(false));
    };
    window.addEventListener(sessionExpiredEvent, expire);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", restore);
    window.addEventListener(signOutStartedEvent, startSignOut);
    window.addEventListener(signOutCancelledEvent, cancelSignOut);
    return () => {
      window.removeEventListener(sessionExpiredEvent, expire);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener(signOutStartedEvent, startSignOut);
      window.removeEventListener(signOutCancelledEvent, cancelSignOut);
    };
  }, [queryClient]);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: authKeys.current });
  }, [pathname, queryClient]);

  useEffect(() => {
    if (signingOut || (!unauthorized && !expired)) return;
    const destination = `${window.location.pathname}${window.location.search}`;
    let active = true;
    void queryClient.cancelQueries().then(() => {
      if (!active) return;
      queryClient.clear();
      router.replace(`/login?next=${encodeURIComponent(destination)}`);
    });
    return () => {
      active = false;
    };
  }, [expired, pathname, queryClient, router, unauthorized, signingOut]);

  if (query.isPending || unauthorized || expired || restoring || signingOut)
    return (
      <main aria-busy="true" className="mx-auto grid max-w-5xl gap-4 px-4 py-12">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  if (query.isError) return <PageError onRetry={() => void query.refetch()} />;
  return <PortalShell adminName={query.data.name}>{children}</PortalShell>;
}
