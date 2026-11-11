import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";
import { renderToString } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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
});
