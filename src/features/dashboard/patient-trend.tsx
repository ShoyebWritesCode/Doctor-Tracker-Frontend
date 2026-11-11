"use client";

import { useId, useState } from "react";
import type { DashboardSummary } from "@/features/dashboard/api";
import { formatCalendarDate } from "@/features/dashboard/range";
import { formatCount } from "@/features/dashboard/metric-summary";
import { chartPoint, chartScale, nearestPoint } from "@/features/dashboard/chart-math";

export function PatientTrend({
  points,
  timezone,
}: {
  points: DashboardSummary["patientsByDate"];
  timezone: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(points.length - 1);
  const index = Math.min(selected, points.length - 1);
  const point = points[index];
  const scale = chartScale(points.map((value) => value.count));
  if (!point) return <p className="text-ink-muted min-h-64 text-sm">Daily data is unavailable.</p>;
  const position = chartPoint(index, point.count, points.length, scale.maximum);
  const total = points.reduce((sum, value) => sum + value.count, 0);
  const activeDays = points.filter((value) => value.count > 0).length;
  const coordinates = points
    .map((value, pointIndex) => {
      const p = chartPoint(pointIndex, value.count, points.length, scale.maximum);
      return `${p.x},${p.y}`;
    })
    .join(" ");
  const valueText = `${formatCalendarDate(point.date)}: ${formatCount(point.count)} ${point.count === 1 ? "patient" : "patients"}`;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      <p className="text-ink-muted text-sm leading-6" id={`${id}-summary`}>
        {total === 0
          ? "No patients were added in this period."
          : `${formatCount(total)} ${total === 1 ? "patient was" : "patients were"} added across ${activeDays} ${activeDays === 1 ? "date" : "dates"} with new records.`}
      </p>
      <div className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-x-2">
        <div
          aria-hidden="true"
          className="text-ink-subtle flex h-64 flex-col justify-between py-2 text-right text-xs"
        >
          {scale.ticks.map((tick) => (
            <span key={tick}>
              {new Intl.NumberFormat("en-GB", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(tick)}
            </span>
          ))}
        </div>
        <div className="relative h-64 min-w-0">
          <svg
            aria-label="Daily patient creation chart"
            aria-describedby={`${id}-summary`}
            role="img"
            className="h-full w-full"
            viewBox="0 0 720 240"
            preserveAspectRatio="none"
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              if (bounds.width)
                setSelected(
                  nearestPoint((event.clientX - bounds.left) / bounds.width, points.length),
                );
            }}
          >
            {scale.ticks.map((tick) => {
              const y = chartPoint(0, tick, points.length, scale.maximum).y;
              return (
                <line
                  key={tick}
                  x1="0"
                  x2="720"
                  y1={y}
                  y2={y}
                  stroke="var(--border-default)"
                  strokeDasharray={tick === 0 ? undefined : "3 5"}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {points.length > 1 ? (
              <polyline
                points={coordinates}
                fill="none"
                stroke="var(--action-primary)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <line
              x1={position.x}
              x2={position.x}
              y1="8"
              y2="232"
              stroke="var(--border-strong)"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span
            aria-hidden="true"
            className="border-surface-raised bg-action pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ left: `${position.x / 7.2}%`, top: `${position.y / 2.4}%` }}
          />
          <span
            aria-hidden="true"
            className="bg-ink pointer-events-none absolute top-3 max-w-[95%] -translate-x-1/2 rounded-md px-2.5 py-1.5 text-center text-xs leading-5 text-white"
            style={{ left: `${Math.max(25, Math.min(75, position.x / 7.2))}%` }}
          >
            {formatCalendarDate(point.date, true)} · {formatCount(point.count)}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="text-ink-subtle col-start-2 flex justify-between gap-2 pt-2 text-xs"
        >
          <span>{formatCalendarDate(points[0]!.date, true)}</span>
          {points.length > 2 ? (
            <span className="hidden sm:inline">
              {formatCalendarDate(points[Math.floor(points.length / 2)]!.date, true)}
            </span>
          ) : null}
          {points.length > 1 ? <span>{formatCalendarDate(points.at(-1)!.date, true)}</span> : null}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label htmlFor={`${id}-inspect`} className="font-semibold">
            Inspect daily patient count
          </label>
          <output aria-label="Selected day" aria-live="polite">
            {valueText}
          </output>
        </div>
        <input
          id={`${id}-inspect`}
          className="accent-action min-h-11 w-full min-w-0"
          type="range"
          min={0}
          max={points.length - 1}
          step={1}
          value={index}
          disabled={points.length === 1}
          aria-valuetext={valueText}
          onChange={(event) => setSelected(Number(event.target.value))}
        />
        <p className="text-ink-muted text-xs">
          Use arrow keys or move over the chart. Counts use {timezone}.
        </p>
      </div>
      <details className="border-border border-t pt-3">
        <summary className="text-action min-h-11 cursor-pointer text-sm font-semibold">
          View daily data
        </summary>
        <div className="max-h-72 overflow-y-auto">
          <table aria-label="Daily patient creation data" className="w-full text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="border-border border-b py-2">
                  Date ({timezone})
                </th>
                <th scope="col" className="border-border border-b py-2 text-right">
                  Patients added
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((value) => (
                <tr key={value.date}>
                  <th scope="row" className="border-border border-b py-2 font-normal">
                    {formatCalendarDate(value.date)}
                  </th>
                  <td className="border-border border-b py-2 text-right">
                    {formatCount(value.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
