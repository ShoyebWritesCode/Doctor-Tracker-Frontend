import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";
import { renderToString } from "react-dom/server";

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => vi.unstubAllGlobals());

function renderLogin(nextPath = "/patients?status=active") {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  client.setQueryData(["private", "stale"], ["previous-session"]);
  render(
    <QueryClientProvider client={client}>
      <LoginForm nextPath={nextPath} />
    </QueryClientProvider>,
  );
  return client;
}

async function enterCredentials() {
  await userEvent.type(
    screen.getByRole("textbox", { name: "Email address" }),
    "admin@example.test",
  );
  await userEvent.type(screen.getByLabelText("Password"), "fictional-password-only");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("disables native submission before hydration and never uses a credential-bearing GET", () => {
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <LoginForm />
      </QueryClientProvider>,
    );
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelector("form")?.getAttribute("method")).toBe("post");
    expect(document.querySelector('button[type="submit"]')?.hasAttribute("disabled")).toBe(true);
  });
  it("uses visible credential labels and an accessible password visibility control", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginForm />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveAttribute(
      "autocomplete",
      "username",
    );
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("validates before sending credentials and focuses the first invalid field", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveFocus();
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a generic failure without exposing server diagnostics or losing entered values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "INTERNAL_ERROR", message: "Private server diagnostic" },
          }),
          { status: 500 },
        ),
      ),
    );
    renderLogin();
    await enterCredentials();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not sign you in. Try again.",
    );
    expect(screen.queryByText("Private server diagnostic")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue(
      "admin@example.test",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("prevents duplicate submission while pending and clears private cache on success", async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const client = renderLogin();
    await enterCredentials();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(fetch).toHaveBeenCalledOnce();
    resolve(
      new Response(
        JSON.stringify({
          data: { id: "fictional-admin", name: "Demo Administrator", email: "admin@example.test" },
        }),
      ),
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/patients?status=active"));
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(client.getQueryData(["private", "stale"])).toBeUndefined();
    expect(client.getQueryData(["auth", "current"])).toMatchObject({ id: "fictional-admin" });
  });
});
