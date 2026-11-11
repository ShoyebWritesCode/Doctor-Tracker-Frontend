import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MobileRecord,
  MobileRecordField,
  MobileRecordList,
} from "@/components/layout/mobile-record-list";

describe("mobile record headings", () => {
  it.each([undefined, 3] as const)(
    "uses the correct heading level for context %s",
    (headingLevel) => {
      render(
        <MobileRecordList label="Fictional records">
          <MobileRecord title="Fictional record" {...(headingLevel ? { headingLevel } : {})}>
            <MobileRecordField label="Condition">Routine review</MobileRecordField>
          </MobileRecord>
        </MobileRecordList>,
      );
      expect(
        screen.getByRole("heading", { level: headingLevel ?? 2, name: "Fictional record" }),
      ).toBeVisible();
      expect(screen.getByRole("list", { name: "Fictional records" })).toBeVisible();
    },
  );
});
