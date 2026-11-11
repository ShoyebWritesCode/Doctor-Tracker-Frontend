import { describe, expect, it } from "vitest";
import {
  buildPatientPatch,
  patientFormValues,
  readGlobalPatientState,
  type Patient,
} from "@/features/patients/api";
import { serializeListState } from "@/lib/list-state";

const patient: Patient = {
  id: "000000000000000000000001",
  doctor: { id: "000000000000000000000002", name: "Dr. Fictional" },
  name: "Fictional Patient",
  email: "fictional@example.test",
  phone: "+880 01700000000",
  condition: "Review",
  status: "active",
  dateOfBirth: "1990-02-28",
  gender: "prefer_not_to_say",
  lastVisitAt: "2026-01-01T12:34:56.789Z",
  notes: "Fictional note",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("patient editing contract", () => {
  it("omits unchanged fields and only allows editable properties", () => {
    expect(buildPatientPatch(patient, patientFormValues(patient))).toEqual({});
    expect(
      buildPatientPatch(patient, {
        ...patientFormValues(patient),
        condition: "Aftercare",
        status: "follow_up",
        email: undefined,
      }),
    ).toEqual({ condition: "Aftercare", status: "follow_up", email: null });
  });
  it("does not treat equivalent timestamps or normalized emails as changes", () => {
    expect(
      buildPatientPatch(patient, {
        ...patientFormValues(patient),
        email: "FICTIONAL@example.test",
        lastVisitAt: "2026-01-01T18:34:56.789+06:00",
      }),
    ).toEqual({});
  });
  it("clears optional values explicitly rather than omitting the removal", () => {
    expect(
      buildPatientPatch(patient, {
        ...patientFormValues(patient),
        notes: undefined,
        dateOfBirth: undefined,
        gender: undefined,
        lastVisitAt: undefined,
      }),
    ).toEqual({ notes: null, dateOfBirth: null, gender: null, lastVisitAt: null });
  });
  it("validates doctor IDs without leaking global filters into scoped lists", () => {
    const state = readGlobalPatientState(
      new URLSearchParams(`doctorId=${patient.doctor.id}&condition=Review&status=active&page=2`),
    );
    expect(state).toMatchObject({
      doctorId: patient.doctor.id,
      condition: "Review",
      status: "active",
      page: 2,
    });
    expect(readGlobalPatientState(new URLSearchParams(serializeListState(state)))).toEqual(state);
    expect(readGlobalPatientState(new URLSearchParams("doctorId=not-an-id")).doctorId).toBe("");
  });
});
