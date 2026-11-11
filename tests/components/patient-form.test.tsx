import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PatientForm } from "@/features/patients/patient-form";
import { ApiError } from "@/lib/api/client";

describe("PatientForm", () => {
  it("hydrates edit fields and preserves optional date precision without changing untouched values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const initialValues = {
      name: "Fictional Patient",
      condition: "Review",
      status: "follow_up" as const,
      phone: "+880 1700 000000",
      dateOfBirth: "1990-02-28",
      gender: "prefer_not_to_say" as const,
      lastVisitAt: "2026-01-01T12:34:56.789Z",
      notes: "Fictional note",
    };
    render(
      <PatientForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByRole("textbox", { name: "Patient name" })).toHaveValue(initialValues.name);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(initialValues));
  });
  it("focuses a missing contact and submits a trimmed, typed patient without empty optional values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PatientForm onSubmit={onSubmit} onCancel={vi.fn()} pending={false} error={null} />);
    await user.type(screen.getByRole("textbox", { name: "Patient name" }), " Fictional Patient ");
    await user.type(screen.getByRole("textbox", { name: "Condition" }), " Routine review ");
    await user.click(screen.getByRole("button", { name: "Create patient" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Email (optional)" })).toHaveFocus();
    await user.type(screen.getByRole("textbox", { name: "Phone (optional)" }), "+880 01700000000");
    await user.click(screen.getByRole("button", { name: "Create patient" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Fictional Patient",
        condition: "Routine review",
        status: "active",
        phone: "+880 01700000000",
        email: undefined,
        gender: undefined,
      }),
    );
  });

  it("retains entries and shows authoritative server errors even after successful client validation", async () => {
    const user = userEvent.setup();
    const props = { onSubmit: vi.fn(), onCancel: vi.fn(), pending: false };
    const { rerender } = render(<PatientForm {...props} error={null} />);
    const contact = screen.getByRole("textbox", { name: "Email (optional)" });
    await user.type(contact, "fictional@example.test");
    await user.tab();
    rerender(
      <PatientForm
        {...props}
        error={
          new ApiError({
            status: 400,
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            fieldErrors: { email: ["Review this email address."] },
          })
        }
      />,
    );
    expect(contact).toHaveValue("fictional@example.test");
    expect(contact).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText("Review this email address.").length).toBeGreaterThan(0);
    rerender(<PatientForm {...props} pending={true} error={null} />);
    expect(screen.getByRole("button", { name: "Create patient" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
