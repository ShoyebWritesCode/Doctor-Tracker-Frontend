"use client";

import { MoreHorizontal, Search, Stethoscope, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { FormErrorSummary } from "@/components/feedback/form-error-summary";
import { InlineError } from "@/components/feedback/inline-error";
import {
  MobileRecord,
  MobileRecordField,
  MobileRecordList,
} from "@/components/layout/mobile-record-list";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import {
  TableShell,
  tableCellClassName,
  tableHeaderClassName,
} from "@/components/layout/table-shell";
import { Toolbar } from "@/components/layout/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { TextareaField } from "@/components/ui/textarea-field";
import { TextField } from "@/components/ui/text-field";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";

const longName = "Dr. Alexandra Catherine Montgomery-Rahman";

export function ComponentGallery() {
  const [checked, setChecked] = useState(true);
  const [page, setPage] = useState(4);
  const [specialty, setSpecialty] = useState("cardiology");
  const notify = useToast();

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        actions={<Button>Primary action</Button>}
        description="An internal inventory for interaction, content stress, and responsive review. This route returns 404 in production."
        eyebrow="Development only"
        title="Interface foundations"
      />

      <Section
        description="Every action has a visible focus state and at least a 44 px target."
        title="Actions and status"
      >
        <div className="flex flex-wrap gap-3">
          <Button>Save doctor</Button>
          <Button variant="secondary">Add note</Button>
          <Button variant="outline">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Archive</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Active</Badge>
          <Badge tone="success">Verified</Badge>
          <Badge tone="warning">Review due</Badge>
          <Badge tone="danger">Suspended</Badge>
        </div>
      </Section>

      <Section
        description="Labels, hints, and validation are programmatically associated."
        title="Form controls"
      >
        <FormErrorSummary
          errors={[
            { fieldId: "gallery-name", message: "Enter a full name." },
            { fieldId: "gallery-email", message: "Enter a valid email address." },
          ]}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            description="Use the clinician's legal name."
            id="gallery-name"
            label="Full name"
            placeholder="Dr. Samira Khan"
            required
          />
          <TextField
            error="Enter a valid email address."
            id="gallery-email"
            label="Email address"
            value="invalid@"
            readOnly
          />
          <SelectField
            label="Specialty"
            onValueChange={setSpecialty}
            options={[
              { label: "Cardiology", value: "cardiology" },
              { label: "Neurology", value: "neurology" },
              { label: "General medicine", value: "general" },
            ]}
            value={specialty}
          />
          <TextareaField
            description="Visible to authorized operations staff."
            label="Administrative note"
            placeholder="Add relevant context…"
          />
        </div>
        <Checkbox
          checked={checked}
          description="Enables booking for new patients."
          label="Accepting new patients"
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <InlineError>The record changed in another session. Refresh before saving.</InlineError>
      </Section>

      <Section
        description="Focus is trapped in overlays and restored to the trigger on close."
        title="Overlays and notifications"
      >
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit clinician</DialogTitle>
                <DialogDescription>
                  Update details for {longName}. Changes are recorded in the audit history.
                </DialogDescription>
              </DialogHeader>
              <TextField label="Registration number" defaultValue="BMDC-A-20841" />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Save changes</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="grid gap-2 pr-10">
                <DrawerTitle className="text-lg font-semibold">Filter doctors</DrawerTitle>
                <DrawerDescription className="text-ink-muted text-sm leading-6">
                  Narrow the directory without leaving the current page.
                </DrawerDescription>
              </div>
              <div className="mt-6 grid gap-5">
                <SelectField
                  label="Status"
                  options={[
                    { label: "All statuses", value: "all" },
                    { label: "Active", value: "active" },
                  ]}
                  value="all"
                />
                <DrawerClose asChild>
                  <Button>Apply filters</Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Open record actions" size="icon" variant="outline">
                <MoreHorizontal aria-hidden="true" className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Record actions</DropdownMenuLabel>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Edit doctor</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <Trash2 aria-hidden="true" className="size-4" />
                Archive record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip content="Search by name, registration, or specialty">
            <Button aria-label="Search help" size="icon" variant="outline">
              <Search aria-hidden="true" className="size-5" />
            </Button>
          </Tooltip>
          <ConfirmationDialog
            actionLabel="Archive doctor"
            description="The doctor will no longer appear in active results. This can be reversed later."
            onConfirm={() => notify({ title: "Doctor archived", tone: "success" })}
            title="Archive this doctor?"
          >
            <Button variant="danger">Confirm action</Button>
          </ConfirmationDialog>
          <Button
            onClick={() =>
              notify({
                description: "The doctor record is now up to date.",
                title: "Changes saved",
                tone: "success",
              })
            }
            variant="secondary"
          >
            Show notification
          </Button>
        </div>
      </Section>

      <Section
        description="The same records become purpose-built rows on small screens."
        title="Data display"
      >
        <div className="hidden sm:block">
          <TableShell label="Doctors">
            <thead>
              <tr>
                <th className={tableHeaderClassName}>Doctor</th>
                <th className={tableHeaderClassName}>Specialty</th>
                <th className={tableHeaderClassName}>Registration</th>
                <th className={tableHeaderClassName}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tableCellClassName}>
                  <span className="font-semibold">{longName}</span>
                  <span className="text-ink-muted block">
                    alexandra.montgomery.rahman@example-healthcare.test
                  </span>
                </td>
                <td className={tableCellClassName}>Cardiology</td>
                <td className={tableCellClassName}>BMDC-A-20841</td>
                <td className={tableCellClassName}>
                  <Badge tone="success">Active</Badge>
                </td>
              </tr>
            </tbody>
          </TableShell>
        </div>
        <MobileRecordList className="sm:hidden" label="Doctors">
          <MobileRecord actions={<Badge tone="success">Active</Badge>} title={longName}>
            <MobileRecordField label="Specialty">Cardiology</MobileRecordField>
            <MobileRecordField label="Registration">BMDC-A-20841</MobileRecordField>
            <MobileRecordField label="Email">
              alexandra.montgomery.rahman@example-healthcare.test
            </MobileRecordField>
          </MobileRecord>
        </MobileRecordList>
        <Pagination onPageChange={setPage} page={page} totalPages={18} />
      </Section>

      <Section title="Loading and empty states">
        <div className="grid gap-3" aria-label="Loading doctors">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <EmptyState
          action={<Button>Add first doctor</Button>}
          description="Add a clinician or adjust the current filters to see results here."
          icon={Stethoscope}
          title="No doctors found"
        />
      </Section>

      <Section title="Toolbar composition">
        <Toolbar>
          <div className="w-full max-w-sm">
            <TextField label="Search records" placeholder="Name, email, or registration" />
          </div>
          <Button variant="outline">Filters</Button>
        </Toolbar>
      </Section>
    </main>
  );
}
