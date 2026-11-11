"use client";

import { LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/api";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import { notifySignOutStarted, notifySignOutCancelled } from "@/features/auth/session-events";
import { reloadAfterSignOut } from "@/features/auth/logout-navigation";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  async function finishSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    reloadAfterSignOut();
  }
  const mutation = useMutation({
    mutationFn: async () => {
      // Pause the boundary before revocation so cache clearing cannot trigger a competing 401 redirect.
      notifySignOutStarted();
      await queryClient.cancelQueries();
      return logout();
    },
    onSuccess: finishSignOut,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void finishSignOut();
        return;
      }
      notifySignOutCancelled();
      notify({
        title: "Sign out failed",
        description: "We could not confirm sign-out. Try again.",
        tone: "danger",
      });
    },
  });
  return (
    <Button
      aria-label={compact ? "Sign out" : undefined}
      loading={mutation.isPending}
      onClick={() => mutation.mutate()}
      size={compact ? "icon" : "default"}
      variant="ghost"
    >
      <LogOut aria-hidden="true" className="size-4" />
      {compact ? null : "Sign out"}
    </Button>
  );
}
