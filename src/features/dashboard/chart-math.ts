export function chartScale(counts: readonly number[]) {
  const maximum = Math.max(0, ...counts);
  const step = Math.max(1, Math.ceil(maximum / 4));
  return { maximum: step * 4, ticks: [4, 3, 2, 1, 0].map((value) => value * step) };
}
export function chartPoint(index: number, count: number, length: number, maximum: number) {
  return {
    x: length <= 1 ? 360 : 8 + (index / (length - 1)) * 704,
    y: 8 + (1 - count / maximum) * 224,
  };
}
export function nearestPoint(relativeX: number, length: number) {
  return Math.max(
    0,
    Math.min(length - 1, Math.round(((relativeX * 720 - 8) / 704) * (length - 1))),
  );
}
