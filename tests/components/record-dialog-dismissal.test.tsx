import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { DoctorForm } from "@/features/doctors/doctor-form";
import { AddPatient } from "@/features/patients/patient-mutations";

describe.each([
  { kind: "doctor", trigger: "Add doctor", title: "Add a doctor", field: "Full name" },
  { kind: "patient", trigger: "Add patient", title: "Add a patient", field: "Patient name" },
])("$kind dialog dismissal", ({ kind, trigger, title, field }) => {
  function setup() {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          {kind === "doctor" ? (
            <DoctorForm />
          ) : (
            <AddPatient doctorId="76948b8f0279310d44b19645" doctorName="Fictional Doctor" />
          )}
        </ToastProvider>
      </QueryClientProvider>,
    );
    return userEvent.setup();
  }

  it.each(["Close dialog", "Cancel"])(
    "does not insert validation errors between pointer-down and pointer-up on %s",
    async (dismissLabel) => {
      const user = setup();
      await user.click(screen.getByRole("button", { name: trigger }));
      await waitFor(() => expect(screen.getByRole("textbox", { name: field })).toHaveFocus());
      const dismiss = screen.getByRole("button", { name: dismissLabel });
      await user.pointer({ target: dismiss, keys: "[MouseLeft>]" });
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
      await user.pointer({ keys: "[/MouseLeft]" });
      expect(screen.queryByRole("dialog", { name: title })).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("button", { name: trigger })).toHaveFocus());
      await user.click(screen.getByRole("button", { name: trigger }));
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
    },
  );

  it("still validates normal field blur and permits Escape after errors", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: trigger }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: field })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole("textbox", { name: field })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: title })).not.toBeInTheDocument();
  });
});
