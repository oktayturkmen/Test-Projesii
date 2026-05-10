export function range(start: number, end: number): number[] {
  if (end < start) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

