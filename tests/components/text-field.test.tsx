import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "@/components/ui/text-field";

describe("TextField", () => {
  it("associates its label, help text, and error", () => {
    render(
      <TextField
        description="Use the work address."
        error="Enter a valid email address."
        label="Email address"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Use the work address. Enter a valid email address.");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
  });
});
