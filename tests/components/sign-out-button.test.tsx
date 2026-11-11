import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { SignOutButton } from "@/features/auth/sign-out-button";

const reloadAfterSignOut = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/logout-navigation", () => ({ reloadAfterSignOut }));
afterEach(() => vi.unstubAllGlobals());

function renderSignOut() {
  const client = new QueryClient();
  client.setQueryData(["private", "patients"], ["fictional-record"]);
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe("sign out", () => {
  it("preserves the active session and private cache when revocation fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    const client = renderSignOut();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText("Sign out failed");
    expect(reloadAfterSignOut).not.toHaveBeenCalled();
    expect(client.getQueryData(["private", "patients"])).toEqual(["fictional-record"]);
  });

  it("clears private data and redirects after successful server revocation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const client = renderSignOut();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(reloadAfterSignOut).toHaveBeenCalledOnce());
    expect(client.getQueryData(["private", "patients"])).toBeUndefined();
  });
});
