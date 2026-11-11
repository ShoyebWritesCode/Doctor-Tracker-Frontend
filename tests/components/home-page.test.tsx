import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("identifies the application and current foundation state", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Doctor Tracker" })).toBeVisible();
    expect(screen.getByText("Foundation ready")).toBeVisible();
  });
});
