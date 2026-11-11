import type { ReactNode } from "react";
import { SessionBoundary } from "@/features/auth/session-boundary";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <SessionBoundary>{children}</SessionBoundary>;
}
