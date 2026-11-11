"use client";

import { LayoutDashboard, Menu, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctors", icon: Stethoscope, label: "Doctors" },
  { href: "/patients", icon: Users, label: "Patients" },
] as const;

function Navigation({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="grid gap-1">
      {navigation.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-control flex min-h-11 items-center gap-3 border-l-4 px-3 py-2 text-sm font-semibold",
              active
                ? "border-action bg-action-soft text-action-hover"
                : "text-ink-muted hover:bg-surface-subtle hover:text-ink border-transparent",
            )}
            href={href}
            key={href}
            {...(close ? { onClick: close } : {})}
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalShell({ adminName, children }: { adminName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        className="focus:rounded-control focus:bg-surface-raised sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <aside className="border-border bg-surface-raised hidden border-r lg:flex lg:flex-col">
        <div className="border-border border-b px-5 py-5">
          <p className="text-ink font-semibold tracking-tight">Doctor Tracker</p>
          <p className="text-ink-muted mt-1 text-xs">Operations workspace</p>
        </div>
        <div className="flex-1 p-3">
          <Navigation />
        </div>
        <div className="border-border border-t p-4">
          <p className="text-ink truncate text-sm font-semibold">{adminName}</p>
          <p className="text-ink-muted mb-2 text-xs">Administrator</p>
          <SignOutButton />
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-border bg-surface-raised/95 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
          <Drawer onOpenChange={setOpen} open={open}>
            <DrawerTrigger asChild>
              <Button aria-label="Open navigation" size="icon" variant="ghost">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="right-auto left-0 w-[min(20rem,calc(100%-1rem))] border-r border-l-0">
              <div className="pr-10">
                <DrawerTitle className="text-ink text-lg font-semibold">Doctor Tracker</DrawerTitle>
                <DrawerDescription className="text-ink-muted text-sm">
                  Operations workspace
                </DrawerDescription>
              </div>
              <div className="mt-6">
                <Navigation close={() => setOpen(false)} />
              </div>
              <div className="border-border mt-8 border-t pt-4">
                <p className="text-ink truncate text-sm font-semibold">{adminName}</p>
                <SignOutButton />
              </div>
            </DrawerContent>
          </Drawer>
          <p className="text-ink font-semibold">Doctor Tracker</p>
          <SignOutButton compact />
        </header>
        <main
          className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
