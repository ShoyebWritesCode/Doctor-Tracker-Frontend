"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InlineError } from "@/components/feedback/inline-error";
import { useToast } from "@/components/ui/toast";
import { PatientForm } from "@/features/patients/patient-form";
import {
  createDoctorPatient,
  deleteDoctorPatient,
  patientKeys,
  type Patient,
  type PatientInput,
} from "@/features/patients/api";
import { doctorKeys } from "@/features/doctors/api";

async function refreshRecords(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: patientKeys.all }),
    client.invalidateQueries({ queryKey: doctorKeys.all }),
    client.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export function AddPatient({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const notify = useToast();
  const mutation = useMutation({
    mutationFn: (input: PatientInput) => createDoctorPatient(doctorId, input),
    onSuccess: async (patient) => {
      await refreshRecords(client);
      setOpen(false);
      notify({
        title: "Patient added",
        description: `${patient.name} is assigned to ${doctorName}.`,
        tone: "success",
      });
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) {
          setOpen(next);
          if (next) mutation.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Add patient</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" showClose={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>Add a patient</DialogTitle>
          <DialogDescription>
            Assigned to {doctorName}. Name, condition, status, and at least one contact method are
            required.
          </DialogDescription>
        </DialogHeader>
        <PatientForm
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={(input) => mutation.mutate(input)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeletePatient({
  patient,
  doctorId,
  onDeleted,
}: {
  patient: Patient;
  doctorId: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const notify = useToast();
  const mutation = useMutation({
    mutationFn: () => deleteDoctorPatient(doctorId, patient.id),
    onSuccess: async () => {
      await refreshRecords(client);
      setOpen(false);
      notify({
        title: "Patient deleted",
        description: `${patient.name}'s record was permanently deleted.`,
        tone: "success",
      });
      // The deleted row (and its trigger) no longer exists. Restore a useful keyboard target.
      onDeleted();
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) {
          setOpen(next);
          if (next) mutation.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-danger"
          aria-label={`Delete patient ${patient.name}`}
        >
          Delete patient
        </Button>
      </DialogTrigger>
      <DialogContent showClose={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>Delete {patient.name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes {patient.name}&apos;s patient record. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {mutation.isError ? (
          <InlineError>Deletion failed. The record has not been removed. Try again.</InlineError>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
