"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListLoading, ListError } from "@/components/layout/list-feedback";
import { InlineError } from "@/components/feedback/inline-error";
import { useToast } from "@/components/ui/toast";
import { PatientForm } from "@/features/patients/patient-form";
import {
  buildPatientPatch,
  getPatient,
  patientFormValues,
  patientKeys,
  updatePatient,
  type PatientPatch,
} from "@/features/patients/api";
import { refreshRecords } from "@/features/patients/patient-mutations";
import { ApiError } from "@/lib/api/client";

export function PatientEditDialog({
  patientId,
  onClose,
  restoreFocus,
}: {
  patientId: string;
  onClose: () => void;
  restoreFocus: () => void;
}) {
  const client = useQueryClient();
  const notify = useToast();
  const patient = useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: ({ signal }) => getPatient(patientId, signal),
    staleTime: 0,
    refetchOnMount: "always",
    // The initial fresh read hydrates the draft; reconnects must not reset unsaved input.
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 1,
  });
  const mutation = useMutation({
    mutationFn: (patch: PatientPatch) => updatePatient(patientId, patch),
    onSuccess: async (record) => {
      await refreshRecords(client);
      onClose();
      notify({
        title: "Patient updated",
        description: `${record.name}'s changes have been saved. Current filters still apply.`,
        tone: "success",
      });
    },
  });
  const missing = [patient.error, mutation.error].some(
    (error) => error instanceof ApiError && error.status === 404,
  );
  async function close() {
    if (mutation.isPending) return;
    if (missing) await refreshRecords(client);
    onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void close();
      }}
    >
      <DialogContent
        className="max-w-2xl"
        showClose={!mutation.isPending}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit patient</DialogTitle>
          <DialogDescription>
            Update patient details. The assigned doctor cannot be changed.
          </DialogDescription>
        </DialogHeader>
        {missing ? (
          <InlineError>
            This patient is no longer available. Close this dialog to refresh the directory.
          </InlineError>
        ) : patient.isPending || patient.isFetching ? (
          <ListLoading label="Loading current patient details" />
        ) : patient.isError ? (
          <ListError onRetry={() => void patient.refetch()} />
        ) : (
          <PatientForm
            key={patient.data.id}
            initialValues={patientFormValues(patient.data)}
            submitLabel="Save changes"
            pending={mutation.isPending}
            error={mutation.error}
            onCancel={() => void close()}
            onSubmit={(input) => {
              const patch = buildPatientPatch(patient.data, input);
              if (!Object.keys(patch).length) {
                onClose();
                notify({
                  title: "No changes to save",
                  description: "The patient record is unchanged.",
                });
              } else mutation.mutate(patch);
            }}
          />
        )}
        {missing || patient.isPending || patient.isFetching || patient.isError ? (
          <Button variant="outline" onClick={() => void close()}>
            Close
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
