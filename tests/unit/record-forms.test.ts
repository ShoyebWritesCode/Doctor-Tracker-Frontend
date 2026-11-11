import { describe, expect, it } from "vitest";
import { doctorFormSchema } from "@/features/doctors/api";
import { patientFormSchema } from "@/features/patients/api";

describe("record form constraints", () => {
  it("keeps phone values as text and trims doctor input", () => {
    const result = doctorFormSchema.parse({
      name: " Dr. Samira ",
      email: "samira@example.test",
      phone: "+880 01700000000",
      hospital: "Central Hospital",
      specialization: "Cardiology",
    });
    expect(result.name).toBe("Dr. Samira");
    expect(result.phone).toBe("+880 01700000000");
    expect(doctorFormSchema.safeParse({ ...result, phone: 1700000000 }).success).toBe(false);
  });
  it("requires a contact method and validates optional calendar dates", () => {
    const basic = { name: "Fictional Patient", condition: "Routine review", status: "active" };
    expect(patientFormSchema.safeParse(basic).success).toBe(false);
    expect(
      patientFormSchema.safeParse({ ...basic, phone: "01700000000", email: "", notes: "" }).success,
    ).toBe(true);
    expect(
      patientFormSchema.safeParse({
        ...basic,
        email: "patient@example.test",
        dateOfBirth: "2001-02-29",
      }).success,
    ).toBe(false);
  });
});
