"use client";

import { LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/api";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notify = useToast();
  async function finishSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }
  const mutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: finishSignOut,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void finishSignOut();
        return;
      }
      notify({
        title: "Sign out failed",
        description: "Your session is still active. Try again.",
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
