type FieldError = { fieldId: string; message: string };

export function FormErrorSummary({ errors }: { errors: readonly FieldError[] }) {
  if (errors.length === 0) return null;
  return (
    <div
      className="rounded-control border-danger/30 bg-danger-soft border p-4"
      role="alert"
      tabIndex={-1}
    >
      <h2 className="text-danger text-sm font-semibold">Please correct the following:</h2>
      <ul className="text-danger mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a className="underline underline-offset-2" href={`#${error.fieldId}`}>
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
